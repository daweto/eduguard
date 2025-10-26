# EduGuard - Setup Instructions

## Prerequisites

- Node.js >= 18
- pnpm 8.15.6
- Cloudflare account (for deployment)
- Wrangler CLI installed globally: `npm install -g wrangler`

## Development Setup

### 1. Install Dependencies

```bash
# Install all dependencies from root
pnpm install
```

### 2. Backend Setup (api-v2)

```bash
cd apps/api-v2

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create eduguard-db

# Update the database_id in wrangler.jsonc with the ID from above

# Create R2 bucket
wrangler r2 bucket create eduguard-photos

# Run migrations (creates database tables)
wrangler d1 execute eduguard-db --local --file=./migrations/0000_skinny_maestro.sql

# Start dev server
pnpm dev

# In a new terminal, seed reference data (Chilean grades/stages)
curl -X POST http://localhost:8787/api/seed

# For remote database:
wrangler d1 execute eduguard-db --remote --file=./migrations/0000_skinny_maestro.sql
# Then seed via API after deploying
```

### 3. Frontend Setup (teacher-client)

```bash
cd apps/teacher-client

# Copy environment template
cp .env.example .env

# Edit .env if needed (default points to localhost:8787)

# Start dev server
pnpm dev
```

## Running the Application

### Development Mode

1. **Terminal 1 - Backend API:**
   ```bash
   cd apps/api-v2
   pnpm dev
   ```
   API will be available at `http://localhost:8787`

2. **Terminal 2 - Seed the database (first time only):**
   ```bash
   curl -X POST http://localhost:8787/api/seed
   ```
   This seeds Chilean school grades and stages

3. **Terminal 3 - Frontend:**
   ```bash
   cd apps/teacher-client
   pnpm dev
   ```
   Frontend will be available at `http://localhost:5173`

4. **Open your browser:**
   Navigate to `http://localhost:5173`

### Verify Seeding

Check if the database has been seeded:
```bash
curl http://localhost:8787/api/seed/status
```

## Features Implemented

### F1: Student Enrollment ✅

- Upload student portrait photos (1-3 per student)
- Automatic photo storage in R2
- Immediate AWS Rekognition indexing of each enrollment photo (these become the reference dataset for attendance)
- Store student and guardian information in D1 database
- Preview enrolled students roster
- Delete students (optional)

## Technology Stack

### Backend
- **Hono** - Web framework
- **Cloudflare Workers** - Serverless compute
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Object storage
- **Drizzle ORM** - Type-safe database queries

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool
- **TailwindCSS v4** - Styling
- **ShadCN UI** - Component library
- **TypeScript** - Type safety

## Database Schema

The application uses four main tables:

### `stages`
- Chilean school system stages (Preschool, Elementary, Secondary)
- Display names in Spanish

### `grades`
- Chilean grades from Prekinder to 4° Medio
- 14 grades total with proper ordering
- Foreign key to stages table

### `students`
- Student information (name, grade)
- Guardian contact details (name, phone, email)
- Enrollment metadata
- Status tracking
- Optional foreign key to grades table

### `student_faces`
- Links students to their face embeddings
- Stores photo URLs (R2 keys)
- AWS Rekognition face IDs
- Quality scores

**Note:** Reference data (Chilean school grades and stages) is seeded via the TypeScript seed function at `src/db/seed.ts`. Run the seed endpoint after migrations. See `MIGRATIONS_GUIDE.md` for details.

## Next Steps (Future Development)

1. **F2: Photo-Based Attendance:**
   - Implement classroom photo capture
   - Face detection and matching
   - Present/absent student lists

2. **F3: AI Reasoning & Flagging:**
   - Pattern detection for at-risk students
   - Truancy alerts

3. **F4: Voice Agent:**
   - ElevenLabs integration
   - Spanish language parent notifications

## Troubleshooting

### D1 Database Not Found
```bash
# Recreate database
wrangler d1 create eduguard-db
# Run migrations again
wrangler d1 execute eduguard-db --local --file=./migrations/0000_skinny_maestro.sql
```

### R2 Bucket Not Found
```bash
wrangler r2 bucket create eduguard-photos
```

### CORS Errors (API)
- Make sure the backend API is running on `localhost:8787`
- Check `VITE_API_URL` in frontend `.env` file

### CORS Errors (R2 Photo Uploads)
If you see CORS errors when uploading photos, you need to configure CORS on the R2 bucket.

**Option 1: Using Wrangler (Recommended)**
```bash
cd apps/api-v2
npx wrangler r2 bucket cors set eduguard-photos --file cors.json
```

Create `apps/api-v2/cors.json`:
```json
{
  "rules": [
    {
      "allowed": {
        "methods": ["GET", "HEAD", "PUT", "POST"],
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "headers": ["*"]
      },
      "exposeHeaders": ["ETag"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

**Option 2: Using Cloudflare Dashboard**
1. Go to R2 in your Cloudflare dashboard
2. Select the `eduguard-photos` bucket
3. Go to Settings → CORS Policy
4. Add the CORS configuration above

**For Production:**
Update `rules[0].allowed.origins` to include your production domain:
```json
{
  "rules": [
    {
      "allowed": {
        "methods": ["GET", "HEAD", "PUT", "POST"],
        "origins": ["http://localhost:5173", "https://your-production-domain.com"],
        "headers": ["*"]
      },
      "exposeHeaders": ["ETag"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

### Type Errors
```bash
# Regenerate Drizzle types
cd apps/api-v2
npx drizzle-kit generate
```

## Deployment

### Backend
```bash
cd apps/api-v2
pnpm deploy
```

### Frontend
```bash
cd apps/teacher-client
pnpm build
# Deploy dist/ folder to your preferred hosting (Vercel, Cloudflare Pages, etc.)
```

## Support

For issues or questions, check the spec.md for detailed architecture and API documentation.
