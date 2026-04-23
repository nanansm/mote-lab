-- Replace 'tiktok' marketplace with 'tokopedia' across all tables.
-- This is safe: if no tiktok rows exist yet, the UPDATE is a no-op.

UPDATE products      SET marketplace = 'tokopedia' WHERE marketplace = 'tiktok';
UPDATE shops         SET marketplace = 'tokopedia' WHERE marketplace = 'tiktok';
UPDATE ingest_queue  SET marketplace = 'tokopedia' WHERE marketplace = 'tiktok';
