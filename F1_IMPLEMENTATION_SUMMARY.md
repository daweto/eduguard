# F1: Student Enrollment — Implementation Summary (Current)

## Status

- Student and guardian profiles now capture split name fields with required `firstName`, `lastName`, and `identificationNumber`.
- Direct-to-R2 uploads remain the preferred path and Rekognition face indexing is **required** for F1; enrollment fails if `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, or `AWS_REKOGNITION_COLLECTION` are missing.
- Delete flow continues to clean up R2 objects and Rekognition faces when credentials are present.

## What’s Implemented

### Backend (apps/api-v2)

- Direct-to-R2 presign: POST `/api/uploads/presign`
  - Returns presigned S3-compatible PUT URLs that target Cloudflare R2.
  - Body: `{ purpose: 'student_photo', count: number (1-3), contentType?: string }`
  - Response: `{ bucket, uploads: [{ key, upload_url, content_type }] }`
- Enrollment: POST `/api/students`
  - Requires AWS Rekognition env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_REKOGNITION_COLLECTION` (or default collection used if provided).
  - Accepts:
    - Preferred: `photo_keys: string[]` (from presigned uploads), or
    - Legacy: `photos: [{ data: base64, filename }]`.
  - Moves images to `students/{studentId}/photo-N.jpg` in R2.
  - Calls Rekognition `IndexFaces(Image.Bytes)` per photo and stores real `face_id` in D1.
  - Returns: `{ student_id, status: 'enrolled', photos_stored, aws_faces_indexed, face_ids }`.
- Students listing/details:
  - GET `/api/students` includes `photo_urls`.
  - GET `/api/students/:id` includes `photo_urls` and `face_ids`.
- Delete student: DELETE `/api/students/:id`
  - Deletes R2 photos under `students/{id}`.
  - Deletes faces from Rekognition.
- CORS enabled.

### Frontend (apps/teacher-client)

- `enrollStudent()` now posts the nested `{ student, guardian }` payload with the expanded name/ID fields; the backend enforces Rekognition indexing and returns an error if credentials are not configured.
- `StudentEnrollmentForm` collects the new student/guardian fields, supports selecting existing guardians, and surfaces backend errors when Rekognition is misconfigured.
- Student roster cards show complete names plus identification numbers; guardian views were updated to display and capture the new structure.
- Types include `photo_keys` and mirror the Drizzle insert types.

## Storage + Indexing Flow

1. Client requests presigned uploads from Worker.
2. Client PUTs photos to R2 using signed URLs.
3. Client POSTs `/api/students` with `photo_keys`.
4. Worker copies to `students/{studentId}` in R2.
5. Worker calls Rekognition `IndexFaces(Image.Bytes)` per photo and stores `face_id` in D1.
6. Response returns `face_ids` and counts.

## API Contracts (Relevant)

### POST /api/uploads/presign

Request: `{ purpose: 'student_photo', count?: number, contentType?: string }`
Response:

```
{
  "bucket": "...",
  "uploads": [
    { "key": "uploads/tmp/2025-10-25/<uuid>/photo-1.jpg", "upload_url": "...", "content_type": "image/jpeg" }
  ]
}
```

### POST /api/students

Required payload:

```
{
  "student": {
    "firstName": "Sofía",
    "middleName": "Isabel",
    "lastName": "Martínez",
    "secondLastName": "González",
    "identificationNumber": "12.345.678-9",
    "gradeId": "3ro-basico"
  },
  "guardian": (
    { "id": "existing-guardian-id" }
    |
    {
      "firstName": "María",
      "middleName": "Josefina",
      "lastName": "Martínez",
      "secondLastName": "López",
      "identificationNumber": "10.987.654-3",
      "phone": "+56 9 1234 5678",
      "email": "maria@example.com",
      "preferredLanguage": "es",
      "relation": "Madre",
      "address": "Av. Libertad 123"
    }
  ),
  "photo_keys": ["uploads/tmp/.../photo-1.jpg", "uploads/tmp/.../photo-2.jpg"]
}
```

Legacy fallback (base64 images):

```
{
  "student": { ...same fields as above... },
  "guardian": { ...same fields as above... },
  "photos": [
    { "data": "data:image/jpeg;base64,...", "filename": "sofia-1.jpg" }
  ]
}
```

Response:

```
{
  "student_id": "...",
  "status": "enrolled",
  "photos_stored": 2,
  "aws_faces_indexed": 2,
  "face_ids": ["aws-face-abc123", "aws-face-def456"]
}
```

### DELETE /api/students/:id

Response:

```
{
  "deleted": true,
  "student_id": "...",
  "faces_removed": <number>
}
```

## Environment & Config

- AWS Rekognition (optional but enables real face IDs):
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_REKOGNITION_COLLECTION`
- R2 S3-compatible presign credentials:
  - `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Bindings (wrangler.jsonc): `DB` (D1), `PHOTOS` (R2)

## Gaps vs spec.md

- F1 flow meets spec; enrollment now hard-requires Rekognition. No mock IDs are stored.

## Next (Optional)

- Add signed GETs/public delivery for photos if UI needs direct access.
- Health endpoint to verify Rekognition collection exists and list counts.
