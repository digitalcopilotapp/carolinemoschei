#!/bin/bash
# =============================================================================
# Digital Copilot — Automated Backup Script
# Run via cron: 0 3 * * * /opt/dc-tracking/scripts/backup.sh
# =============================================================================

set -euo pipefail

BACKUP_DIR="/backups"
DATE=$(date +%Y-%m-%d_%H-%M)
COMPOSE_DIR="/opt/dc-tracking"

# Retention in days
RETENTION_PG=30
RETENTION_STALWART=14
RETENTION_REDIS=7

mkdir -p "$BACKUP_DIR/postgres" "$BACKUP_DIR/stalwart" "$BACKUP_DIR/redis"

echo "[$(date)] Starting backups..."

# --- PostgreSQL ---
echo "[$(date)] Backing up PostgreSQL databases..."
for DB in listmonk chatwoot dcbridge; do
  docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T postgres \
    pg_dump -U dcadmin -d "$DB" | gzip > "$BACKUP_DIR/postgres/${DB}_${DATE}.sql.gz"
  echo "  ✓ $DB"
done

# --- Stalwart Mail ---
echo "[$(date)] Backing up Stalwart Mail data..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T stalwart \
  tar czf - /opt/stalwart-mail > "$BACKUP_DIR/stalwart/stalwart_${DATE}.tar.gz"
echo "  ✓ stalwart"

# --- Redis ---
echo "[$(date)] Backing up Redis..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T redis \
  redis-cli -a "$REDIS_PASSWORD" BGSAVE > /dev/null 2>&1
sleep 2
docker cp dc-redis:/data/dump.rdb "$BACKUP_DIR/redis/redis_${DATE}.rdb"
gzip "$BACKUP_DIR/redis/redis_${DATE}.rdb"
echo "  ✓ redis"

# --- Cleanup old backups ---
echo "[$(date)] Cleaning up old backups..."
find "$BACKUP_DIR/postgres" -name "*.sql.gz" -mtime +$RETENTION_PG -delete
find "$BACKUP_DIR/stalwart" -name "*.tar.gz" -mtime +$RETENTION_STALWART -delete
find "$BACKUP_DIR/redis" -name "*.rdb.gz" -mtime +$RETENTION_REDIS -delete

echo "[$(date)] Backup complete!"
echo "  Disk usage: $(du -sh $BACKUP_DIR | cut -f1)"
