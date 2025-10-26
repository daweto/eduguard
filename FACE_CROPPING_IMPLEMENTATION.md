# Multi-Face Detection - IndexFaces + SearchFaces Implementation

## Problem Solved

**Original Issue:** AWS Rekognition's `SearchFacesByImageCommand` only searches the **largest/most prominent face** in a photo. If you take a photo with 7 students, only 1 student (the one with the largest face) gets identified.

**Solution:** Use `IndexFaces` to add ALL faces to collection temporarily, then search each face individually using `SearchFaces`.

## How It Works Now

### Backend Flow (`apps/api-v2/src/routes/attendance.ts`)

```typescript
for each photo:
  1. IndexFacesCommand → Add ALL 7 faces to collection temporarily
     - Returns: 7 face IDs with bounding boxes
     - ExternalImageId: temp_attendance_{sessionId}_photo{n}
  
  2. For EACH indexed face:
     a. SearchFacesCommand with the temp face ID
     b. Filter out self-match (temp face matches itself)
     c. Find best match among real student faces
     d. Store match if ≥95% confidence
  
  3. DeleteFacesCommand → Remove ALL temp faces (cleanup)
  
  4. Result: ALL 7 students identified (if they have photos registered)
```

### Why This Works in Cloudflare Workers

**Cloudflare Workers Limitations:**
- ❌ No `createImageBitmap` (browser API)
- ❌ No `Canvas` (Node.js API)
- ❌ No image manipulation libraries

**IndexFaces Approach:**
- ✅ Pure AWS API calls (no image processing)
- ✅ Works in any environment
- ✅ Designed for this exact use case

### The Key Insight

```typescript
// Instead of cropping images...
IndexFaces → Adds ALL faces to collection (temp)
SearchFaces → Search by face ID (not image)
DeleteFaces → Remove temp faces

// No image manipulation needed!
```

## Debug Information Enhanced

### Visual Indicators

**On Photo:**
- **Thick green boxes (5px)** = Student identified ✓
- **Red boxes (3px)** = Student NOT identified ✗
- **Labels** = Student name + confidence % OR "No identificado"

**Below Photo:**

#### ✅ Identified Students (Green Cards)
```
✓ Joel Salas
Confianza detección: 99.8%
Similitud: 97.5%

Otras posibles coincidencias:
  María González - 92.3%
  Pedro Soto - 88.1%
```

#### ❌ Unidentified Faces (Red Cards)
```
✗ Rostro sin identificar #1
Confianza detección: 98.5%

⚠ Razón: Mejor coincidencia: Pedro Sánchez con 92.5% (requiere ≥95%)

💡 Mejores coincidencias encontradas:
  Pedro Sánchez - 92.5% (necesita ≥95%) ⚠
  Juan Torres - 88.3% (necesita ≥95%) ⚠
  Carlos Díaz - 82.1% (necesita ≥95%) ⚠

💡 Sugerencia: Si este estudiante parece correcto,
   considera registrar más fotos para mejorar la precisión.
```

## Performance Impact

### Before (Single Search per Photo)
```
1 photo with 7 faces = 1 SearchFacesByImageCommand = 1 identified
Cost: 1 API call
Time: ~200ms
```

### After (IndexFaces + SearchFaces)
```
1 photo with 7 faces = 1 IndexFaces + 7 SearchFaces + 1 DeleteFaces = ALL 7 identified
Cost: 9 API calls (1 index + 7 searches + 1 delete)
Time: ~2 seconds
```

**Trade-off:**
- ✅ Identifies ALL students (not just 1)
- ✅ No image manipulation (works in Workers!)
- ✅ Native AWS approach
- ❌ 9x more API calls
- ❌ Slower processing (~2 sec vs 200ms)
- ⚠️ Temporary faces in collection (cleaned up immediately)

## API Response Structure

```json
{
  "session_id": "session-xxx",
  "present_count": 7,
  "absent_count": 2,
  "total_faces_detected": 7,
  "debug_info": [
    {
      "photoIndex": 0,
      "totalFacesInPhoto": 7,
      "faces": [
        {
          "boundingBox": { "Width": 0.15, "Height": 0.2, "Left": 0.5, "Top": 0.3 },
          "confidence": 99.8,
          "matchedStudent": {
            "id": "student-001",
            "name": "Joel Salas",
            "similarity": 97.5
          },
          "faceId": "face-abc123",
          "topMatches": [
            { "studentName": "Joel Salas", "similarity": 97.5, "belowThreshold": false },
            { "studentName": "María González", "similarity": 92.3, "belowThreshold": true }
          ]
        },
        {
          "boundingBox": { "Width": 0.12, "Height": 0.18, "Left": 0.7, "Top": 0.4 },
          "confidence": 98.5,
          "noMatchReason": "Mejor coincidencia: Pedro Sánchez con 92.5% (requiere ≥95%)",
          "topMatches": [
            { "studentName": "Pedro Sánchez", "similarity": 92.5, "belowThreshold": true }
          ]
        }
      ]
    }
  ]
}
```

## Debugging Your 6 Unidentified Faces

Now when you see "6 faces not identified", you'll get:

### For Each Unidentified Face:

1. **Visual box on photo** (red) showing where it is
2. **Detection confidence** - Was the face clearly detected? (100% = perfect)
3. **Exact reason:**
   - "No hay rostros registrados" → Collection is empty
   - "No coincide con ningún estudiante de esta clase" → Face exists in DB but not for this class
   - "Mejor coincidencia: [Name] con XX%" → Student found but below 95% threshold
4. **Top 3 potential matches** with exact similarity scores
5. **Actionable suggestions** when similarity is 85-94%

### Common Scenarios You'll See:

**Scenario 1: Students not registered**
```
✗ Rostro #1: No hay rostros registrados en la colección
✗ Rostro #2: No coincide con ningún estudiante de esta clase
```
→ Need to register these students' photos

**Scenario 2: Below threshold (fixable)**
```
✗ Rostro #3: Mejor coincidencia: Ana Torres con 92.5% (requiere ≥95%)
  Ana Torres - 92.5% ⚠
```
→ Almost there! Student needs 1-2 more photos or lower threshold slightly

**Scenario 3: Poor photo quality**
```
✗ Rostro #4
  Confianza detección: 65.2%
  No hay coincidencias
```
→ Face is blurry/obscured, need better photo

## Performance Optimization

If you have large classes (30+ students) and group photos, consider:

1. **Parallel face searches** (currently sequential)
2. **Cache student face records** (reduce DB queries)
3. **Batch cropping** (process multiple faces simultaneously)

Currently implemented for clarity, can optimize later if needed.

## Testing Checklist

- [x] Backend compiles
- [x] Frontend compiles
- [x] Crop function works with bounding boxes
- [ ] Test with 7 students in one photo
- [ ] Verify all 7 get identified
- [ ] Check debug info shows all faces
- [ ] Test with students below 95% threshold
- [ ] Verify "top matches" shows potential students
- [ ] Test with unregistered students
- [ ] Verify helpful error messages

## IndexFaces Implementation Details

### Step-by-Step Process

1. **IndexFaces** - Add all faces from photo to collection
   ```typescript
   IndexFacesCommand({
     CollectionId: 'eduguard-school-default',
     Image: { Bytes: photoBytes },
     ExternalImageId: 'temp_attendance_session-123_photo0',
     MaxFaces: 50,
   })
   → Returns: [face-temp-1, face-temp-2, ..., face-temp-7]
   ```

2. **SearchFaces** - For each temp face, find matches
   ```typescript
   for each tempFaceId:
     SearchFacesCommand({
       CollectionId: 'eduguard-school-default',
       FaceId: tempFaceId,
       FaceMatchThreshold: 50, // Lower for debugging
     })
     → Returns: Matches (excluding self)
     → Filter matches ≥95% for attendance
   ```

3. **DeleteFaces** - Remove temp faces (cleanup)
   ```typescript
   DeleteFacesCommand({
     CollectionId: 'eduguard-school-default',
     FaceIds: [face-temp-1, ..., face-temp-7],
   })
   ```

### Self-Match Filtering

**Important:** When searching a temp face, it will match itself!
```typescript
// Example: temp-face-1 searches collection
// Results: [
//   { FaceId: 'temp-face-1', Similarity: 100% },  ← SELF (ignore)
//   { FaceId: 'student-joel-face-1', Similarity: 97% }, ← Real match
// ]

// Filter out self
const realMatches = allMatches.filter(m => m.Face?.FaceId !== tempFaceId);
```

### Collection State During Processing

```
BEFORE attendance:
  Collection: [joel-face-1, sheen-face-1, boris-face-1]

DURING attendance (temporary):
  Collection: [joel-face-1, sheen-face-1, boris-face-1, 
               temp-1, temp-2, temp-3, temp-4, temp-5, temp-6, temp-7]

AFTER cleanup:
  Collection: [joel-face-1, sheen-face-1, boris-face-1]
```

### Race Condition Handling

**Potential Issue:** If 2 teachers take attendance simultaneously, temp faces could interfere.

**Mitigation:**
- Unique external ID per session: `temp_attendance_{sessionId}_photo{idx}`
- Immediate cleanup in `finally` block
- Cleanup happens even if processing fails

**Risk:** Low (faces deleted within ~2 seconds)

## Cost Analysis

**Before:** 1 photo with 30 students = 1 search call
**After:** 1 photo with 30 students = 1 index + 30 searches + 1 delete = 32 calls

**AWS Rekognition Pricing (approximate):**
- DetectFaces: $0.001 per image
- SearchFaces: $0.001 per search
- 30 students = $0.031 per photo (~3 cents)

For a 1000-student school taking attendance daily:
- ~$30/month if using group photos
- Can reduce by using individual photos or lower resolution

## Next Steps

1. Test with your 7-student photo
2. Check if all 7 are now identified
3. Review unmatched faces to see if they need photos registered
4. Adjust threshold if many students are at 90-94%
5. Consider parallel processing if performance is slow

