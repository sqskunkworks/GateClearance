-- Migration: add additional_comments column to applications table
-- Add to your migrations folder and run in Supabase SQL Editor

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS additional_comments text;