-- Unify Project Model Migration
-- This migration updates the projects table to support a unified schema for both URL-based and bundle-based projects.

-- 1. Add new columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('url', 'bundle')) DEFAULT 'url';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('deploying', 'active', 'failed', 'error')) DEFAULT 'deploying';

-- 2. Migrate existing data
-- Assume all existing projects were "url" types
UPDATE projects SET type = 'url' WHERE type IS NULL;
UPDATE projects SET source = original_url WHERE source IS NULL AND original_url IS NOT NULL;
UPDATE projects SET status = 'active' WHERE status IS NULL OR status = 'deployed'; -- 'deployed' was used in the Edge Function

-- 3. Cleanup old columns (Optional, but recommended for unification)
-- Wait until after code refactor to drop these if needed.
-- ALTER TABLE projects DROP COLUMN original_url;
-- ALTER TABLE projects DROP COLUMN deployment_status;
