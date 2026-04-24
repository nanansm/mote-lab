-- Add review_count and total_sold to shops table for Tokopedia-specific stats
ALTER TABLE shops ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS total_sold INTEGER NOT NULL DEFAULT 0;
