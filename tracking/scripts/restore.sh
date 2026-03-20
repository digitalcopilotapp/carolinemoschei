#!/bin/bash
# =============================================================================
# Digital Copilot — Restore Script
# Usage: ./scripts/restore.sh [postgres|stalwart|redis] [backup_file]
# =============================================================================

set -euo pipefail

COMPOSE_DIR="/opt/dc-tracking"

if [ $# -lt 2 ]; then
  echo "Usage: $0 [postgres|stalwart|redis] [backup_file]"
  echo ""
  echo "Examples:"
  echo "  $0 postgres /backups/postgres/listmonk_2026-03-14_03-00.sql.gz"
  echo "  $0 stalwart /backups/stalwart/stalwart_2026-03-14_03-30.tar.gz"
  echo "  $0 redis /backups/redis/redis_2026-03-14_03-15.rdb.gz"
  exit 1
fi

TYPE=$1
FILE=$2

if [ ! -f "$FILE" ]; then
  echo "Error: Backup file not found: $FILE"
  exit 1
fi

case $TYPE in
  postgres)
    # Extract database name from filename (e.g., listmonk_2026-03-14.sql.gz -> listmonk)
    DB_NAME=$(basename "$FILE" | sed 's/_[0-9].*$//')
    echo "Restoring PostgreSQL database: $DB_NAME from $FILE"
    echo "WARNING: This will DROP and recreate the database. Press Ctrl+C to cancel."
    read -r -p "Continue? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 0
    fi

    docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T postgres \
      psql -U dcadmin -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T postgres \
      psql -U dcadmin -c "CREATE DATABASE ${DB_NAME};"
    gunzip -c "$FILE" | docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T postgres \
      psql -U dcadmin -d "$DB_NAME"
    echo "✓ PostgreSQL database $DB_NAME restored"
    ;;

  stalwart)
    echo "Restoring Stalwart Mail data from $FILE"
    echo "WARNING: This will overwrite current mail data. Press Ctrl+C to cancel."
    read -r -p "Continue? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 0
    fi

    docker compose -f "$COMPOSE_DIR/docker-compose.yml" stop stalwart
    docker cp "$FILE" dc-stalwart:/tmp/restore.tar.gz
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T stalwart \
      tar xzf /tmp/restore.tar.gz -C /
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" start stalwart
    echo "✓ Stalwart Mail data restored"
    ;;

  redis)
    echo "Restoring Redis from $FILE"
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" stop redis
    gunzip -c "$FILE" > /tmp/redis_restore.rdb
    docker cp /tmp/redis_restore.rdb dc-redis:/data/dump.rdb
    rm /tmp/redis_restore.rdb
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" start redis
    echo "✓ Redis restored"
    ;;

  *)
    echo "Unknown type: $TYPE. Use postgres, stalwart, or redis."
    exit 1
    ;;
esac
