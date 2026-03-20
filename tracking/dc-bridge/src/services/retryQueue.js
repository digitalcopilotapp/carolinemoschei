const pool = require("../db/pool");
const logger = require("../utils/logger");

// Backoff schedule in minutes: 1, 5, 15, 60, 240
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];

/**
 * Add a failed operation to the retry queue.
 */
async function addToRetryQueue(eventType, payload) {
  try {
    await pool.query(
      `INSERT INTO retry_queue (event_type, payload, next_retry)
       VALUES ($1, $2, NOW() + INTERVAL '1 minute')`,
      [eventType, JSON.stringify(payload)]
    );
    logger.info("Added to retry queue", { event_type: eventType });
  } catch (err) {
    logger.error("Failed to add to retry queue", {
      event_type: eventType,
      error: err.message,
    });
  }
}

/**
 * Process pending retries. Called every 60 seconds by the cron.
 */
async function processRetryQueue(handlers) {
  const { rows } = await pool.query(
    `SELECT * FROM retry_queue
     WHERE next_retry <= NOW() AND attempts < max_attempts
     ORDER BY next_retry ASC
     LIMIT 10`
  );

  for (const item of rows) {
    const handler = handlers[item.event_type];
    if (!handler) {
      logger.warn("No handler for retry event type", {
        event_type: item.event_type,
      });
      continue;
    }

    try {
      await handler(item.payload);

      // Success: remove from queue
      await pool.query("DELETE FROM retry_queue WHERE id = $1", [item.id]);
      logger.info("Retry succeeded", {
        id: item.id,
        event_type: item.event_type,
        attempts: item.attempts + 1,
      });
    } catch (err) {
      const nextAttempt = item.attempts + 1;
      const backoffIndex = Math.min(nextAttempt, BACKOFF_MINUTES.length - 1);
      const backoffMin = BACKOFF_MINUTES[backoffIndex];

      if (nextAttempt >= item.max_attempts) {
        // Permanently failed
        await pool.query(
          `UPDATE retry_queue SET attempts = $1, last_error = $2 WHERE id = $3`,
          [nextAttempt, err.message, item.id]
        );
        logger.error("Retry permanently failed", {
          id: item.id,
          event_type: item.event_type,
          attempts: nextAttempt,
          error: err.message,
        });
      } else {
        await pool.query(
          `UPDATE retry_queue
           SET attempts = $1, next_retry = NOW() + INTERVAL '${backoffMin} minutes', last_error = $2
           WHERE id = $3`,
          [nextAttempt, err.message, item.id]
        );
        logger.warn("Retry failed, will retry later", {
          id: item.id,
          event_type: item.event_type,
          attempts: nextAttempt,
          next_retry_minutes: backoffMin,
        });
      }
    }
  }
}

module.exports = { addToRetryQueue, processRetryQueue };
