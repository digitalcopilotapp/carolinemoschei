#!/bin/bash
# =============================================================================
# PostgreSQL Initialization Script
# Creates databases and users for Listmonk, Chatwoot, and dc-bridge
# Runs automatically on first start of the PostgreSQL container
# =============================================================================

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL

    -- Create Listmonk database and user
    CREATE USER ${POSTGRES_LISTMONK_USER} WITH PASSWORD '${POSTGRES_LISTMONK_PASSWORD}';
    CREATE DATABASE ${POSTGRES_LISTMONK_DB} OWNER ${POSTGRES_LISTMONK_USER};
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_LISTMONK_DB} TO ${POSTGRES_LISTMONK_USER};

    -- Create Chatwoot database and user
    CREATE USER ${POSTGRES_CHATWOOT_USER} WITH PASSWORD '${POSTGRES_CHATWOOT_PASSWORD}';
    CREATE DATABASE ${POSTGRES_CHATWOOT_DB} OWNER ${POSTGRES_CHATWOOT_USER};
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_CHATWOOT_DB} TO ${POSTGRES_CHATWOOT_USER};

    -- Create dc-bridge database and user
    CREATE USER ${POSTGRES_DCBRIDGE_USER} WITH PASSWORD '${POSTGRES_DCBRIDGE_PASSWORD}';
    CREATE DATABASE ${POSTGRES_DCBRIDGE_DB} OWNER ${POSTGRES_DCBRIDGE_USER};
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DCBRIDGE_DB} TO ${POSTGRES_DCBRIDGE_USER};

EOSQL

echo "✓ All databases and users created successfully"
