# Debug Mode Configuration

## Overview

The attendance face recognition system has a **toggleable debug mode** that provides detailed information about face detection and matching. This is useful for development and troubleshooting but should be **disabled in production** to reduce payload size and processing overhead.

## Environment Variables

### Backend (API Worker)

**Variable:** `ENABLE_ATTENDANCE_DEBUG`  
**Values:** `'true'` or `'1'` to enable, any other value (or unset) to disable  
**Effect:** Includes detailed debug information in attendance session API response

### Frontend (Teacher Client)

**Variable:** `VITE_ENABLE_ATTENDANCE_DEBUG`  
**Values:** `'true'` to enable, any other value (or unset) to disable  
**Effect:** Shows debug UI section with bounding boxes and match details

## Setup Instructions

### Local Development (Enable Debug)

#### Backend

**Option 1: Using `.dev.vars` file (recommended for local dev)**

Create `apps/api-v2/.dev.vars`:
```bash
# ... other environment variables ...

# Enable attendance debug mode
ENABLE_ATTENDANCE_DEBUG=true
```

**Option 2: Using `wrangler.toml`**

Add to `apps/api-v2/wrangler.jsonc`:
```jsonc
{
  // ... other config ...
  "vars": {
    "ENABLE_ATTENDANCE_DEBUG": "true"
  }
}
```

**Option 3: Command line**
```bash
wrangler dev --var ENABLE_ATTENDANCE_DEBUG:true
```

#### Frontend

Create/update `apps/teacher-client/.env.local`:
```bash
VITE_API_URL=http://localhost:8787
VITE_ENABLE_ATTENDANCE_DEBUG=true
```

Or for quick testing:
```bash
VITE_ENABLE_ATTENDANCE_DEBUG=true pnpm dev
```

### Production (Disable Debug)

#### Backend

**Cloudflare Dashboard:**
1. Go to Workers & Pages
2. Select your worker
3. Settings → Variables
4. Either:
   - Don't add `ENABLE_ATTENDANCE_DEBUG` (disabled by default)
   - OR set `ENABLE_ATTENDANCE_DEBUG=false`

**Wrangler CLI:**
```bash
wrangler secret put ENABLE_ATTENDANCE_DEBUG
# Enter: false
```

#### Frontend

**Option 1: Don't set the variable** (recommended)
- Simply omit `VITE_ENABLE_ATTENDANCE_DEBUG` from production `.env`
- Debug mode disabled by default

**Option 2: Explicitly disable**
```bash
# .env.production
VITE_ENABLE_ATTENDANCE_DEBUG=false
```

## What Changes When Debug is Enabled

### Backend Response

**Debug Disabled (Production):**
```json
{
  "session_id": "session-123",
  "present_count": 7,
  "absent_count": 2,
  "total_faces_detected": 7,
  "present_students": [...],
  "absent_students": [...]
  // No debug_info field
}
```

**Debug Enabled (Development):**
```json
{
  "session_id": "session-123",
  "present_count": 7,
  "absent_count": 2,
  "total_faces_detected": 7,
  "present_students": [...],
  "absent_students": [...],
  "debug_info": [
    {
      "photoIndex": 0,
      "totalFacesInPhoto": 7,
      "faces": [
        {
          "boundingBox": {...},
          "confidence": 99.8,
          "matchedStudent": {...},
          "topMatches": [...],
          "noMatchReason": "..."
        }
      ]
    }
  ]
}
```

**Payload size difference:** ~5-10KB vs 1-2KB (85% smaller in production)

### Frontend UI

**Debug Disabled (Production):**
- Shows attendance results normally
- No debug section
- Clean, simple interface

**Debug Enabled (Development):**
- Shows attendance results
- **+ Debug indicator badge** at top ("🐛 Modo Debug Activo")
- **+ Debug information card** with:
  - Face detection summary
  - Photos with bounding boxes
  - Detailed match information
  - Top 3 potential matches
  - Why faces didn't match

## Console Logging

Debug mode also controls console logging:

**Debug Enabled:**
```
[ATTENDANCE] Photo 1: Indexing all faces with temp ID: temp_attendance_xxx
[ATTENDANCE] Photo 1: Indexed 7 faces
[ATTENDANCE] Searching face 1/7 (ID: face-temp-xxx)
[ATTENDANCE] Face 1 matched 3 potential students (excluding self)
[ATTENDANCE] Cleaning up 7 temporary faces
[ATTENDANCE] ✓ Cleaned up temporary faces
```

**Debug Disabled:**
- Only error logs
- Clean production logs

## Quick Test

### Test Debug Mode is Working:

1. **Enable debug mode** (both backend and frontend)
2. **Take attendance** with a photo
3. **Check for:**
   - "🐛 Modo Debug Activo" badge at top
   - "Información de Depuración" card at bottom
   - Console logs in browser/worker

4. **Disable debug mode**
5. **Take attendance** again
6. **Verify:**
   - No debug badge
   - No debug card
   - Minimal console output

## Environment Variable Summary

| Variable | Location | Values | Default | Purpose |
|----------|----------|--------|---------|---------|
| `ENABLE_ATTENDANCE_DEBUG` | Backend (Worker) | `'true'`/`'1'` | `false` | Include debug_info in response |
| `VITE_ENABLE_ATTENDANCE_DEBUG` | Frontend (React) | `'true'` | `false` | Show debug UI section |

## Best Practices

### Development
```bash
# .dev.vars (backend)
ENABLE_ATTENDANCE_DEBUG=true

# .env.local (frontend)
VITE_ENABLE_ATTENDANCE_DEBUG=true
```

### Staging
```bash
# Enable for testing
ENABLE_ATTENDANCE_DEBUG=true
VITE_ENABLE_ATTENDANCE_DEBUG=true
```

### Production
```bash
# Disabled (omit variables entirely)
# This gives best performance and smallest payloads
```

## Performance Impact

### Debug Disabled (Production)
- Response size: ~2KB
- Processing time: ~2 seconds
- Clean logs
- ✅ Optimized for production

### Debug Enabled (Development)
- Response size: ~10KB (5x larger)
- Processing time: ~2.2 seconds (slightly slower due to extra processing)
- Verbose logs
- Full bounding box and match data
- ✅ Optimized for debugging

## Troubleshooting

**Debug not showing?**
1. Check backend variable: `ENABLE_ATTENDANCE_DEBUG=true` in `.dev.vars`
2. Check frontend variable: `VITE_ENABLE_ATTENDANCE_DEBUG=true` in `.env.local`
3. Restart dev servers (both frontend and backend)
4. Check browser console for DEBUG_ENABLED value

**Debug showing in production?**
1. Check production environment variables
2. Remove or set to `false`
3. Rebuild and redeploy
4. Clear cache if needed

## Code References

### Backend Toggle
```typescript
// apps/api-v2/src/routes/attendance.ts
const debugEnabled = c.env.ENABLE_ATTENDANCE_DEBUG === 'true' || 
                     c.env.ENABLE_ATTENDANCE_DEBUG === '1';

// Only include if enabled
return c.json({
  // ... other fields ...
  ...(debugEnabled && { debug_info: debugInfo }),
});
```

### Frontend Toggle
```typescript
// apps/teacher-client/src/pages/ClassAttendancePage.tsx
const DEBUG_ENABLED = import.meta.env.VITE_ENABLE_ATTENDANCE_DEBUG === 'true';

// Only render if enabled
{DEBUG_ENABLED && attendanceResult.debug_info && (
  <DebugCard>...</DebugCard>
)}
```

## Example Setup Files

### `.dev.vars` (Backend - Local Dev)
```bash
# AWS Rekognition
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_REKOGNITION_COLLECTION=eduguard-school-default

# R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=eduguard-photos
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret

# Debug Mode (DEV ONLY)
ENABLE_ATTENDANCE_DEBUG=true
```

### `.env.local` (Frontend - Local Dev)
```bash
VITE_API_URL=http://localhost:8787
VITE_ENABLE_ATTENDANCE_DEBUG=true
```

### Production (No debug files needed)
- Don't include debug variables
- System defaults to disabled

