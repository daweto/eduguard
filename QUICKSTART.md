# Quick Start Guide - Class-Based Attendance System

## Prerequisites

- Node.js and pnpm installed
- Cloudflare D1 database configured
- AWS Rekognition credentials configured

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Database Migration

```bash
cd apps/api-v2
pnpm migrate:local
```

This will create the new tables:

- teachers
- classrooms
- courses
- classes
- class_enrollments
- sessions
- attendance

### 3. Seed Sample Data

**Option A: Via API (Recommended)**

```bash
# Start the API first
pnpm --filter api-v2 dev

# Then in another terminal, call the seed endpoint
curl -X POST http://localhost:8787/api/seed
```

**Option B: Via Script**

```bash
pnpm --filter api-v2 seed:local
```

This will create:

- 3 teachers (María González, Carlos Rodríguez, Ana Martínez)
- 4 classrooms (A1, A2, B1, Lab Ciencias 1)
- 4 courses (Matemática, Lenguaje, Química, Física)
- 4 class sections
- 3 guardians
- 3 students
- 12 enrollments

### 4. Start Development Servers

**Terminal 1 - API:**

```bash
cd apps/api-v2
pnpm dev
```

**Terminal 2 - Frontend:**

```bash
cd apps/teacher-client
pnpm dev
```

### 5. Access the Application

Open your browser to: http://localhost:5173

You should see "Mis Clases" (My Classes) page automatically.

## Testing the Flow

### Step 1: View Classes

- You'll be logged in as María González (teacher-001)
- You'll see 2 classes:
  - Matemática I - Sección A (Period 1, Room A1)
  - Física I - Sección A (Period 3, Room A1)

### Step 2: Select a Class

- Click on "Matemática I - Sección A"
- You'll see the enrolled students (3 students):
  - Sofía Valentina Muñoz Fernández
  - Diego Matías Fernández López
  - Catalina Isidora Castro Silva

### Step 3: Enroll Student Faces (Required for face recognition)

Before taking attendance, you need to enroll students with their face photos:

1. Go to `/students/enroll`
2. Select one of the existing students
3. Upload 2-3 portrait photos
4. Submit
5. Repeat for each student

### Step 4: Take Attendance

- Click "Capturar Foto" to take photos
- Take 1-10 photos of the classroom
  - **Note**: For testing without actual students, you can use any photos. The system will mark all students as absent if no faces match.
  - For real testing, use photos that include the enrolled students' faces.
- Click "Registrar Asistencia"

### Step 5: View Results

- You'll see:
  - Expected students count
  - Present count (students detected in photos)
  - Absent count (students not detected)
  - List of present students with confidence scores
  - List of absent students

## API Endpoints Reference

### Get Teacher's Classes

```bash
GET /api/classes/teacher/{teacherId}

# Example
curl http://localhost:8787/api/classes/teacher/teacher-001
```

### Get Class Students

```bash
GET /api/classes/{classId}/students

# Example
curl http://localhost:8787/api/classes/class-math-1m-a/students
```

### Submit Attendance Session

```bash
POST /api/attendance/session
Content-Type: application/json

{
  "class_id": "class-math-1m-a",
  "teacher_id": "teacher-001",
  "photos": ["base64_photo_1", "base64_photo_2"],
  "timestamp": "2025-10-25T08:15:00Z"
}
```

## Sample Data Overview

### Teachers

- **teacher-001**: María González (Matemáticas, Física)
- **teacher-002**: Carlos Rodríguez (Lenguaje, Historia)
- **teacher-003**: Ana Martínez (Química, Biología)

### Classes

- **class-math-1m-a**: Matemática I, Section A, Period 1, Room A1 (María González)
- **class-phys-1m-a**: Física I, Section A, Period 3, Room A1 (María González)
- **class-lang-1m-a**: Lenguaje I, Section A, Period 2, Room A2 (Carlos Rodríguez)
- **class-chem-1m-a**: Química I, Section A, Period 4, Lab Ciencias 1 (Ana Martínez)

### Students (All in 1° Medio)

- **student-001**: Sofía Valentina Muñoz Fernández
- **student-002**: Diego Matías Fernández López
- **student-003**: Catalina Isidora Castro Silva

All 3 students are enrolled in all 4 classes.

## Troubleshooting

### Issue: "Cannot find module '@/components/classes/hooks/useTeacherClasses'"

**Solution**: Restart the TypeScript server

- In VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
- Or restart your development server

### Issue: No faces detected in attendance

**Possible causes**:

1. Students haven't been enrolled with face photos
2. Photos don't contain enrolled students' faces
3. AWS Rekognition credentials not configured

**Solution**:

- Make sure to enroll students with photos first
- Use photos that clearly show students' faces
- Verify AWS credentials in `.dev.vars`

### Issue: Migration fails

**Solution**:

```bash
# Reset local database
pnpm --filter api-v2 db:reset
```

## Next Steps

1. **Enroll more students** - Add more students with face photos
2. **Test with real photos** - Take classroom photos with enrolled students
3. **Add more classes** - Create additional class sections
4. **View attendance history** - (To be implemented)
5. **Generate reports** - (To be implemented)

## Environment Variables

Make sure your `.dev.vars` file includes:

```env
# AWS Rekognition
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_REKOGNITION_COLLECTION=eduguard-school-default

# Database (for local development)
DB=<your_d1_binding>
```

## Support

For issues or questions, refer to:

- `IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `PRIORITIES.md` - Project priorities and roadmap
- `spec.md` - Complete product specification
