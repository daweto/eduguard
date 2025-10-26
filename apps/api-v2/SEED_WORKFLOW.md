# Database Seed Workflow with Predictable Face IDs

## Overview

This system uses **predictable `externalImageId`** values for AWS Rekognition faces, allowing database resets without re-uploading photos or re-indexing faces.

## How It Works

1. **Student Enrollment**: When enrolling students with photos:
   - Photos are uploaded to S3/R2
   - Faces are indexed in AWS Rekognition with predictable `externalImageId` like `student-001-photo-1`
   - Both the AWS `faceId` AND our `externalImageId` are stored in the database

2. **Database Reset**: When you reset the local database:
   - Database tables are dropped and recreated
   - Seed data is inserted with `externalImageId` but placeholder `faceId`
   - Photos remain in S3/R2 bucket
   - Face indexes remain in AWS Rekognition

3. **Face Sync**: After seeding, sync face IDs from AWS:
   - Queries AWS Rekognition for all faces by `ExternalImageId`
   - Updates database records with the correct AWS `faceId`
   - Now attendance recognition works immediately!

## Commands

### Full Reset & Reseed (Recommended)

```bash
# In api-v2 directory
pnpm db:reset        # Reset database and run migrations
pnpm seed:full       # Seed data + sync faces from AWS
```

### Step-by-Step

```bash
# 1. Reset database
pnpm db:reset

# 2. Seed base data (students, guardians, etc.)
pnpm seed:local

# 3. Sync face IDs from AWS Rekognition
pnpm sync-faces
```

### Individual Operations

```bash
# Just run migrations on fresh DB
pnpm migrate:local

# Just seed data
pnpm seed:local

# Just sync faces
pnpm sync-faces
```

## ExternalImageId Format

- **Format**: `{studentId}-photo-{photoNumber}`
- **Examples**:
  - `student-001-photo-1`
  - `student-001-photo-2`
  - `student-002-photo-1`

This format is predictable and allows us to reconnect database records to AWS Rekognition faces after a reset.

## Database Schema

The `student_faces` table includes:

- `face_id`: AWS Rekognition's generated UUID (changes are rare)
- `external_image_id`: Our predictable identifier (NEVER changes)
- `photo_url`: S3/R2 key for the photo
- `student_id`: Reference to the student

## Benefits

✅ **No Re-uploading**: Photos stay in S3/R2  
✅ **No Re-indexing**: Faces stay in AWS Rekognition  
✅ **Fast Resets**: Reset dev database in seconds  
✅ **Predictable**: Always know the external ID format  
✅ **Portable**: Easy to sync production → staging

## Troubleshooting

### Face sync shows 0 synced

- Check that AWS credentials are configured in `.dev.vars`
- Verify faces exist in AWS: `aws rekognition list-faces --collection-id eduguard-school-default`
- Ensure photos were uploaded with the new externalImageId format

### Attendance not working after reset

- Run `pnpm sync-faces` to update face IDs from AWS
- Check that student faces have non-placeholder faceId values

### Photos not found in R2

- Seed data uses generic paths like `students/student-001/photo-1.jpg`
- You may need to update these paths to match actual uploaded photos
- Or upload photos with these specific paths

## Migration History

- `0000_skinny_maestro.sql` - Initial schema
- `0001_add_classes_attendance_tables.sql` - Classes and attendance
- `0002_add_grade_sections_attendance_drilldown.sql` - Grade sections
- `0003_add_external_image_id.sql` - **NEW**: Adds `external_image_id` column
