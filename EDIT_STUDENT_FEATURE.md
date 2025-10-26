# Edit Student & Upload Photos Feature

## Overview

Added functionality to edit existing students and upload portrait photos to students that were created without photos (like seeded students). This is essential for the workflow where students are bulk-loaded/seeded first, then photos are added later.

---

## Use Case

**Scenario**: You seed the database with student data (names, RUT, grade, guardian info) but without photos. Later, you want to upload their portrait photos for facial recognition.

**Before**: No way to add photos to existing students.

**After**: Click "Edit / Subir Fotos" button on any student card → Upload 1-5 photos → Photos are indexed with AWS Rekognition.

---

## Changes Made

### 1. **Frontend: New Edit Student Page**

**File**: `apps/teacher-client/src/pages/EditStudentPage.tsx`

**Features**:
- Displays current student information (name, RUT, course, current photos, faces indexed)
- Shows current photos in a grid
- Upload interface for 1-5 new photos
- Photo preview with ability to remove before submitting
- Real-time upload progress
- Success confirmation showing number of faces indexed
- Automatic refresh of student data after upload

**Route**: `/students/:studentId/edit`

**Screenshot of features**:
- Student info card showing enrollment status
- Current photos grid (if any exist)
- Upload section with drag-and-drop or file selection
- Photo previews with remove buttons
- Submit button with upload progress

---

### 2. **Frontend: Updated Student Card**

**File**: `apps/teacher-client/src/components/students/StudentCard.tsx`

**Changes**:
- Added "Edit" button with pencil icon
- Button labeled "Editar / Subir Fotos"
- Placed before the delete button
- Links to `/students/:studentId/edit`

**Visual**:
```
[Editar / Subir Fotos]  (outline button)
[Eliminar Estudiante]    (red button)
```

---

### 3. **Backend: New API Endpoint**

**File**: `apps/api-v2/src/routes/students.ts`

**Endpoint**: `POST /api/students/:id/photos`

**Request Body**:
```json
{
  "photos": [
    "base64_encoded_photo_1",
    "base64_encoded_photo_2",
    "base64_encoded_photo_3"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "student_id": "student-001",
  "photos_uploaded": 3,
  "faces_indexed": [
    {
      "face_id": "aws-face-abc123",
      "photo_key": "students/student-001/photo-1234567890-0.jpg"
    },
    {
      "face_id": "aws-face-def456",
      "photo_key": "students/student-001/photo-1234567890-1.jpg"
    },
    {
      "face_id": "aws-face-ghi789",
      "photo_key": "students/student-001/photo-1234567890-2.jpg"
    }
  ]
}
```

**What it does**:
1. Validates student exists
2. Converts base64 photos to bytes
3. Uploads each photo to R2 storage
4. Indexes each face with AWS Rekognition
5. Stores face ID and photo URL in `student_faces` table
6. Returns success with indexed face information

**Error Handling**:
- Continues processing even if one photo fails
- Logs errors but doesn't stop the entire upload
- Returns partial success if some photos succeed

---

### 4. **Routes Configuration**

**File**: `apps/teacher-client/src/routes.tsx`

**Added Route**:
```typescript
{
  path: ":studentId/edit",
  element: <EditStudentPage />,
  handle: {
    breadcrumb: "Editar",
    breadcrumbKey: "navigation:breadcrumbs.editStudent",
  } satisfies CrumbHandle,
}
```

**Breadcrumb Path**: Home > Estudiantes > Listado > Editar

---

### 5. **i18n Translations**

**File**: `apps/teacher-client/src/i18n/locales/es/navigation.json`

**Added**:
- `breadcrumbs.editStudent`: "Editar"

---

## Usage Workflow

### Step 1: Seed Students (Without Photos)

```bash
curl -X POST http://localhost:8787/api/seed
```

This creates students like:
- Sofía Valentina Muñoz Fernández
- Diego Matías Fernández López
- Catalina Isidora Castro Silva

**Status**: 0 photos, 0 faces indexed ❌ Not ready for attendance

---

### Step 2: Navigate to Student Roster

1. Open app: `http://localhost:5173`
2. Go to sidebar: **Estudiantes** > **Listado**
3. You'll see all seeded students without photos (image placeholder shown)

---

### Step 3: Edit Student & Upload Photos

1. Click **"Editar / Subir Fotos"** on any student card
2. You'll see student info and current photo count (0)
3. Click **"Seleccionar Fotos (0/5)"**
4. Choose 1-5 portrait photos of the student
5. Review photo previews (can remove any)
6. Click **"Subir X Foto(s)"**
7. Wait for upload and indexing
8. See success message: "¡Fotos subidas correctamente!"

**Status**: 3 photos, 3 faces indexed ✅ Ready for attendance

---

### Step 4: Verify Student is Ready

1. Return to student roster
2. Student card now shows:
   - Photos in carousel
   - "3 rostro(s) indexados" ✓ Listo para asistencia

---

### Step 5: Take Attendance

1. Go to **Mis Clases**
2. Select a class where the student is enrolled
3. Click **"Tomar Asistencia"**
4. Capture photo(s) of classroom
5. Student will be detected and marked present! 🎉

---

## Technical Details

### Photo Processing Flow

1. **Frontend** → User selects photos → Convert to base64
2. **API** → Receive base64 → Convert to bytes → Upload to R2
3. **AWS Rekognition** → Index face → Return face ID
4. **Database** → Store face record linking student ID ↔ face ID
5. **Frontend** → Refresh student data → Show updated photo count

### Database Changes

**No schema changes required!** Uses existing tables:
- `students` - Already exists
- `student_faces` - Already exists (stores face IDs)

### File Storage

**Photos stored in R2**:
```
students/{studentId}/photo-{timestamp}-{index}.jpg
```

**Example**:
```
students/student-001/photo-1730000000000-0.jpg
students/student-001/photo-1730000000000-1.jpg
students/student-001/photo-1730000000000-2.jpg
```

---

## Validation & Limits

- **Minimum photos**: 1 per upload
- **Maximum photos**: 5 per upload
- **Maximum file size**: 10MB per photo
- **Allowed formats**: image/* (jpg, png, etc.)
- **Total photos per student**: No hard limit (can upload multiple times)

---

## Error Messages

**Spanish (User-Facing)**:
- "Por favor, selecciona al menos una foto"
- "{filename} no es una imagen válida"
- "{filename} es demasiado grande (máx. 10MB)"
- "Error al cargar el estudiante"
- "Error al subir las fotos"
- "¡Fotos subidas correctamente!"
- "{count} foto(s) subida(s) correctamente"

**English (Console Logs)**:
- `[PHOTO-UPLOAD] ✓ Uploaded to R2: {key}`
- `[PHOTO-UPLOAD] ❌ Failed to upload to R2`
- `[FACE-INDEX] ✓ Indexed face {faceId} for student {studentId}`
- `[FACE-INDEX] ❌ Failed to index face`

---

## API Testing

### Upload Photos to Student

```bash
# Get student ID from roster
STUDENT_ID="student-001"

# Encode photo to base64 (macOS)
BASE64_PHOTO=$(base64 -i photo.jpg)

# Upload
curl -X POST http://localhost:8787/api/students/$STUDENT_ID/photos \
  -H "Content-Type: application/json" \
  -d '{
    "photos": ["'$BASE64_PHOTO'"]
  }'
```

### Verify Student Has Photos

```bash
curl http://localhost:8787/api/students/student-001
```

**Response should include**:
```json
{
  "id": "student-001",
  "photo_urls": ["students/student-001/photo-...jpg"],
  "face_ids": ["aws-face-abc123"]
}
```

---

## Benefits

✅ **Flexible workflow**: Seed students first, add photos later
✅ **Bulk import friendly**: CSV import → Manual photo upload
✅ **Progressive enrollment**: Enroll students immediately, photos can wait
✅ **Easy updates**: Replace or add more photos anytime
✅ **Clear feedback**: Shows photo count and "ready for attendance" status
✅ **Error resilient**: Partial uploads work (if 2/3 photos succeed, you get 2 faces)

---

## Future Enhancements

- [ ] Batch photo upload (multiple students at once)
- [ ] Photo quality validation (face detection check before upload)
- [ ] Photo cropping/editing interface
- [ ] Delete individual photos
- [ ] Reorder photos
- [ ] Photo comparison tool (see which photo AWS uses)
- [ ] Upload from camera (mobile)
- [ ] Drag-and-drop upload interface

---

## Files Modified

### Frontend
- ✅ `apps/teacher-client/src/pages/EditStudentPage.tsx` (NEW)
- ✅ `apps/teacher-client/src/components/students/StudentCard.tsx`
- ✅ `apps/teacher-client/src/routes.tsx`
- ✅ `apps/teacher-client/src/i18n/locales/es/navigation.json`

### Backend
- ✅ `apps/api-v2/src/routes/students.ts`

**Total Lines**: ~350 new lines of code

---

## Testing Checklist

- [ ] Seed database with sample students
- [ ] Navigate to student roster
- [ ] Click "Editar / Subir Fotos" on a student
- [ ] Upload 1 photo → Verify success
- [ ] Upload 3 photos → Verify all indexed
- [ ] Upload 5 photos → Verify all indexed
- [ ] Try uploading 6 photos → Should show error (max 5)
- [ ] Try uploading non-image file → Should show error
- [ ] Try uploading large file (>10MB) → Should show error
- [ ] Verify student card shows photo carousel
- [ ] Verify student card shows face count
- [ ] Take attendance with uploaded student → Should detect
- [ ] Upload photos to student without guardian → Should work
- [ ] Upload photos to student with guardian → Should work

---

## Conclusion

This feature completes the enrollment workflow by allowing photos to be added to students after they've been created. This is essential for schools that want to:
1. Import student data from CSV/database
2. Add photos later during registration/photo day
3. Update photos throughout the year

The student is now fully prepared for facial recognition-based attendance! 🎓📸

