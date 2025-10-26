-- Migration: Add external_image_id to student_faces table
-- This allows us to use predictable identifiers for AWS Rekognition faces

-- Add external_image_id column (nullable initially for existing data)
ALTER TABLE student_faces ADD COLUMN external_image_id TEXT;

-- Create unique index on external_image_id for fast lookups
CREATE UNIQUE INDEX idx_student_faces_external_image_id ON student_faces(external_image_id);

