-- Migration: Add application_type field to support multiple clearance types
-- Created: 2026-02-04
-- Description: Adds application_type enum and column to applications table

-- Step 1: Create enum type for application types
DO $$ BEGIN
  CREATE TYPE application_type AS ENUM ('short_gc', 'annual_gc', 'brown_card');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add application_type column to applications table
-- Using ALTER TABLE ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'application_type'
  ) THEN
    ALTER TABLE applications 
    ADD COLUMN application_type application_type NOT NULL DEFAULT 'short_gc';
  END IF;
END $$;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(application_type);

-- Step 4: Add constraint (enum already enforces, but being explicit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'valid_application_type'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT valid_application_type 
    CHECK (application_type IN ('short_gc', 'annual_gc', 'brown_card'));
  END IF;
END $$;

-- Step 5: Add helpful comment
COMMENT ON COLUMN applications.application_type IS 
'Type of gate clearance application: short_gc (standard one-time visit), annual_gc (recurring visits throughout year), brown_card (authorized personnel)';

-- Step 6: Verify the change
DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'application_type'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE 'SUCCESS: application_type column added to applications table';
  ELSE
    RAISE EXCEPTION 'FAILED: application_type column was not added';
  END IF;
END $$;