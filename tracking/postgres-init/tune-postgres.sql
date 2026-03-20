-- =============================================================================
-- PostgreSQL Tuning for 8GB Server (shared instance)
-- Applied via docker-entrypoint-initdb.d
-- =============================================================================

ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET log_min_duration_statement = 1000;
