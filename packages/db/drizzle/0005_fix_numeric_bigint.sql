-- Upgrade numeric columns to BIGINT to prevent integer overflow.
-- Shopee/Tokopedia prices (~Rp 200.000) × sold (~5.000.000) = 10^12 — far exceeds INT4 max (2.1B).

ALTER TABLE products ALTER COLUMN current_price TYPE BIGINT;
ALTER TABLE products ALTER COLUMN original_price TYPE BIGINT;
ALTER TABLE products ALTER COLUMN total_sold TYPE BIGINT;

ALTER TABLE shops ALTER COLUMN follower_count TYPE BIGINT;
ALTER TABLE shops ALTER COLUMN total_products TYPE BIGINT;
ALTER TABLE shops ALTER COLUMN review_count TYPE BIGINT;
ALTER TABLE shops ALTER COLUMN total_sold TYPE BIGINT;

ALTER TABLE product_snapshots ALTER COLUMN price TYPE BIGINT;
ALTER TABLE product_snapshots ALTER COLUMN sold_count TYPE BIGINT;
