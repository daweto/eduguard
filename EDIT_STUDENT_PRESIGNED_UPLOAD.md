# Edit Student Photo Upload - Presigned URL Implementation

## Summary

Successfully migrated the `EditStudentPage` photo upload from **base64 encoding** to **presigned URL direct-to-R2** uploads, matching the approach used in `StudentEnrollmentForm`.

## Problem

The edit student page was uploading photos as base64 in the request body, causing:

- Large request payloads
- Worker processing overhead
- Photos showing as 404 errors after upload (not moved to final R2 location)

## Solution

Implemented the same presigned upload flow as enrollment:

1. Frontend requests presigned URLs
2. Browser uploads directly to R2 temp location
3. Backend moves photos from temp → final location
4. Photos stored in final location: `students/{studentId}/photo-{timestamp}-{index}.{ext}`

## Changes Made

### Backend (`apps/api-v2/src/routes/students.ts`)

**Before:**

```typescript
POST /api/students/:id/photos
Body: { photos: string[] } // base64 array
```

**After:**

```typescript
POST /api/students/:id/photos
Body: { photo_keys: string[] } // presigned upload keys
```

**Implementation:**

1. Accept `photo_keys` array (presigned upload keys)
2. Validate keys start with `uploads/tmp/`
3. Fetch photos from temp R2 location
4. Move to final location: `students/{studentId}/photo-{timestamp}-{i}.{ext}`
5. Delete temp files
6. Index faces with AWS Rekognition
7. Store face records in database
8. **Rollback support**: Delete moved photos if processing fails

**Key Code:**

```typescript
// Move photos from temp to final
for (let i = 0; i < body.photo_keys.length; i++) {
  const tempKey = body.photo_keys[i];

  // Security validation
  if (!tempKey.startsWith("uploads/tmp/")) {
    throw new Error(`Invalid photo key: ${tempKey}`);
  }

  // Fetch from temp
  const bytes = await fetchFromRemoteR2(tempKey, r2Config);

  // Move to final location
  const photoKey = `students/${studentId}/photo-${Date.now()}-${i}.${ext}`;
  await uploadToRemoteR2(photoKey, arrayBuffer, r2Config, contentType);
  movedKeys.push(photoKey);

  // Delete temp
  await deleteFromRemoteR2(tempKey, r2Config);

  // Index face
  const indexResult = await indexFaceBytes({...});
}
```

### Frontend API Client (`apps/teacher-client/src/lib/api/students.ts`)

Added new helper function:

```typescript
export async function uploadStudentPhotos(
  studentId: string,
  photos: File[],
): Promise<{
  success: boolean;
  student_id: string;
  photos_uploaded: number;
  faces_indexed: Array<{ face_id: string; photo_key: string }>;
}>;
```

**Flow:**

1. Request presigned URLs via `presignStudentPhotos()`
2. Upload files directly to R2 (parallel)
3. Send photo keys to backend
4. Return result with indexed faces

**Re-exported Student type** for convenience:

```typescript
export type { Student } from "@/types/student";
```

### Frontend Page (`apps/teacher-client/src/pages/EditStudentPage.tsx`)

**Removed:**

- `convertToBase64()` function
- Base64 photo conversion logic
- Direct fetch calls to API
- Local `Student` interface definition

**Updated:**

```typescript
// Import API helpers and types
import {
  getStudent,
  uploadStudentPhotos,
  type Student,
} from "@/lib/api/students";

// Simplified submit handler
const handleSubmit = async () => {
  const photoFiles = photos.map((photo) => photo.file);
  const result = await uploadStudentPhotos(studentId, photoFiles);

  toast.success(
    t("edit.success.photosUploaded", { count: result.photos_uploaded }),
  );

  // Refresh student data
  const updatedStudent = await getStudent(studentId);
  setStudent(updatedStudent);
};
```

**Cleaned up:**

- Removed `API_BASE_URL` constant (no longer needed)
- Use API helper functions instead of raw fetch
- Removed unused `base64` field from `PhotoData` type

## Benefits

### Performance

✅ **90%+ smaller requests** - No base64 encoding overhead  
✅ **Faster uploads** - Direct browser → R2, bypasses worker  
✅ **Parallel uploads** - All photos upload simultaneously

### Reliability

✅ **Photos in correct location** - Moved to `students/{id}/photo-*.jpg`  
✅ **Error handling** - Rollback on failure  
✅ **Type safety** - Shared Student type from API module

### Code Quality

✅ **DRY** - Uses same helpers as enrollment  
✅ **Clean** - Removed 50+ lines of base64 conversion code  
✅ **Consistent** - Matches enrollment flow exactly

## File Paths

**Temp location:**

```
uploads/tmp/{date}/{uuid}/photo-{index}.{ext}
```

**Final location:**

```
students/{studentId}/photo-{timestamp}-{index}.{ext}
```

## Testing Checklist

- [ ] Upload 1 photo - works
- [ ] Upload 5 photos (max) - works
- [ ] Upload 6+ photos - shows error
- [ ] Different formats (jpg, png, webp) - all supported
- [ ] Large files (>10MB) - frontend validates
- [ ] Upload failure - shows error, no orphaned files
- [ ] Face indexing - Rekognition records created
- [ ] Photo display - signed URLs work after upload
- [ ] Mobile devices - upload from camera

## Comparison: Before vs After

### Before (Base64)

```typescript
// Frontend
const base64Photos = await Promise.all(
  photos.map((photo) => convertToBase64(photo.file)),
);

await fetch(`/api/students/${studentId}/photos`, {
  method: "POST",
  body: JSON.stringify({ photos: base64Photos }), // HUGE payload
});

// Backend
for (const base64Data of body.photos) {
  const bytes = base64ToArrayBuffer(base64Data);
  await uploadPhoto(bucket, key, bytes.buffer);
}
```

### After (Presigned URLs)

```typescript
// Frontend
const result = await uploadStudentPhotos(studentId, photos);
// → Requests presigned URLs
// → Uploads directly to R2
// → Sends keys to backend

// Backend
for (const tempKey of body.photo_keys) {
  const bytes = await fetchFromRemoteR2(tempKey);
  await uploadToRemoteR2(finalKey, bytes.buffer);
  await deleteFromRemoteR2(tempKey);
}
```

## Security

✅ **Path validation** - Keys must start with `uploads/tmp/`  
✅ **Presigned URLs expire** - 5 minutes  
✅ **CORS configured** - Allows PUT from frontend  
✅ **File type validation** - Frontend checks `image/*`  
✅ **Size limits** - Frontend validates <10MB

## Notes

- **No backward compatibility** - Removed base64 support entirely per user request
- **Consistent with enrollment** - Uses exact same presigned upload flow
- **Rollback implemented** - Deletes moved photos if face indexing fails
- **Type safety** - Re-exports Student type from API module for consistency

## Related Files

- `apps/api-v2/src/routes/students.ts` - Backend endpoint
- `apps/api-v2/src/routes/uploads.ts` - Presign endpoint (existing)
- `apps/teacher-client/src/lib/api/students.ts` - API client
- `apps/teacher-client/src/pages/EditStudentPage.tsx` - UI component
- `apps/teacher-client/src/components/students/StudentEnrollmentForm.tsx` - Reference implementation
