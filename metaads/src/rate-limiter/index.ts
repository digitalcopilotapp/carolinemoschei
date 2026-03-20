import type { MetaRateLimitHeaders } from '../utils/meta-client.js';

interface UsageBucket {
  callCount: number;
  totalCpuTime: number;
  totalTime: number;
  /** Percentage 0-100 */
  percentage: number;
  lastUpdated: number;
}

interface QueuedRequest {
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  isWrite: boolean;
}

const BACKOFF_THRESHOLD = 75;
const PAUSE_THRESHOLD = 95;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60_000;

/** Rate limiter that respects Meta API usage headers */
export class RateLimiter {
  private appUsage: UsageBucket = this.emptyBucket();
  private accountUsage: Map<string, UsageBucket> = new Map();
  private businessUsage: Map<string, UsageBucket> = new Map();
  private queue: QueuedRequest[] = [];
  private processing = false;
  private currentBackoffMs = 0;

  /** Update usage from response headers */
  updateFromHeaders(headers: MetaRateLimitHeaders) {
    const now = Date.now();

    if (headers.appUsage) {
      try {
        const parsed = JSON.parse(headers.appUsage);
        this.appUsage = {
          callCount: parsed.call_count ?? 0,
          totalCpuTime: parsed.total_cputime ?? 0,
          totalTime: parsed.total_time ?? 0,
          percentage: Math.max(
            parsed.call_count ?? 0,
            parsed.total_cputime ?? 0,
            parsed.total_time ?? 0
          ),
          lastUpdated: now,
        };
      } catch { /* ignore malformed headers */ }
    }

    if (headers.accountUsage) {
      try {
        const parsed = JSON.parse(headers.accountUsage);
        // x-ad-account-usage returns { acc_id_util_pct: number }
        const pct = parsed.acc_id_util_pct ?? 0;
        this.accountUsage.set('active', {
          callCount: 0,
          totalCpuTime: 0,
          totalTime: 0,
          percentage: typeof pct === 'number' ? pct : parseFloat(pct) || 0,
          lastUpdated: now,
        });
      } catch { /* ignore */ }
    }

    if (headers.businessUseCaseUsage) {
      try {
        const parsed = JSON.parse(headers.businessUseCaseUsage);
        // Format: { "business_id": [{ type, call_count, total_cputime, total_time, estimated_time_to_regain_access }] }
        for (const [bizId, usageArr] of Object.entries(parsed)) {
          if (!Array.isArray(usageArr) || usageArr.length === 0) continue;
          const u = usageArr[0] as Record<string, number>;
          this.businessUsage.set(bizId, {
            callCount: u.call_count ?? 0,
            totalCpuTime: u.total_cputime ?? 0,
            totalTime: u.total_time ?? 0,
            percentage: Math.max(
              u.call_count ?? 0,
              u.total_cputime ?? 0,
              u.total_time ?? 0
            ),
            lastUpdated: now,
          });
        }
      } catch { /* ignore */ }
    }
  }

  /** Get the highest usage percentage across all buckets */
  getMaxUsage(): number {
    let max = this.appUsage.percentage;
    for (const bucket of this.accountUsage.values()) {
      if (bucket.percentage > max) max = bucket.percentage;
    }
    for (const bucket of this.businessUsage.values()) {
      if (bucket.percentage > max) max = bucket.percentage;
    }
    return max;
  }

  /** Get current status for the get_rate_limit_status tool */
  getStatus() {
    const businessEntries: Record<string, UsageBucket> = {};
    for (const [key, val] of this.businessUsage.entries()) {
      businessEntries[key] = val;
    }
    const accountEntries: Record<string, UsageBucket> = {};
    for (const [key, val] of this.accountUsage.entries()) {
      accountEntries[key] = val;
    }

    const maxUsage = this.getMaxUsage();
    let status: 'ok' | 'warning' | 'throttled';
    if (maxUsage >= PAUSE_THRESHOLD) status = 'throttled';
    else if (maxUsage >= BACKOFF_THRESHOLD) status = 'warning';
    else status = 'ok';

    return {
      status,
      maxUsagePercent: maxUsage,
      appUsage: this.appUsage,
      accountUsage: accountEntries,
      businessUsage: businessEntries,
      queueLength: this.queue.length,
      currentBackoffMs: this.currentBackoffMs,
    };
  }

  /** Check if we should delay before making a request */
  async waitIfNeeded(): Promise<void> {
    const maxUsage = this.getMaxUsage();

    if (maxUsage >= PAUSE_THRESHOLD) {
      // Hard pause — wait longer
      this.currentBackoffMs = Math.min(
        (this.currentBackoffMs || INITIAL_BACKOFF_MS) * 2,
        MAX_BACKOFF_MS
      );
      await this.sleep(this.currentBackoffMs);
    } else if (maxUsage >= BACKOFF_THRESHOLD) {
      // Soft backoff
      this.currentBackoffMs = Math.min(
        (this.currentBackoffMs || INITIAL_BACKOFF_MS) * 1.5,
        MAX_BACKOFF_MS / 2
      );
      await this.sleep(this.currentBackoffMs);
    } else {
      this.currentBackoffMs = 0;
    }
  }

  /** Enqueue a request with priority (reads before writes) */
  enqueue<T>(fn: () => Promise<T>, isWrite: boolean): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        execute: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        isWrite,
      };

      if (isWrite) {
        this.queue.push(request);
      } else {
        // Insert reads before writes
        const firstWriteIdx = this.queue.findIndex((r) => r.isWrite);
        if (firstWriteIdx === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(firstWriteIdx, 0, request);
        }
      }

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      await this.waitIfNeeded();
      const request = this.queue.shift();
      if (!request) break;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  private emptyBucket(): UsageBucket {
    return { callCount: 0, totalCpuTime: 0, totalTime: 0, percentage: 0, lastUpdated: 0 };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** Singleton rate limiter instance */
export const rateLimiter = new RateLimiter();
