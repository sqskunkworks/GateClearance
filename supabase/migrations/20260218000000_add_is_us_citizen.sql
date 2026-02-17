-- Add is_us_citizen column to applications table
ALTER TABLE applications
ADD COLUMN is_us_citizen boolean;

-- Comment for clarity
COMMENT ON COLUMN applications.is_us_citizen IS 'NULL = not yet answered, TRUE = US citizen, FALSE = non-US citizen';