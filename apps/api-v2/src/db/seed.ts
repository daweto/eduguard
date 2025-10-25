// Seed data for Chilean school stages and grades
import { drizzle } from 'drizzle-orm/d1';
import { stages, grades } from './schema';

export const stagesData = [
  {
    id: 'preschool',
    name: 'preschool',
    displayName: 'Educación Parvularia',
    order: 1,
    description: 'Preschool education level (Prekinder and Kinder)',
  },
  {
    id: 'elementary',
    name: 'elementary',
    displayName: 'Enseñanza Básica',
    order: 2,
    description: 'Elementary education from 1st to 8th grade',
  },
  {
    id: 'secondary',
    name: 'secondary',
    displayName: 'Enseñanza Media',
    order: 3,
    description: 'Secondary education from 1st to 4th year',
  },
];

export const gradesData = [
  // Preschool
  {
    id: 'prekinder',
    name: 'prekinder',
    displayName: 'Prekinder',
    stageId: 'preschool',
    order: 1,
  },
  {
    id: 'kinder',
    name: 'kinder',
    displayName: 'Kinder',
    stageId: 'preschool',
    order: 2,
  },

  // Elementary
  {
    id: '1st-elementary',
    name: '1st-elementary',
    displayName: '1° Básico',
    stageId: 'elementary',
    order: 3,
  },
  {
    id: '2nd-elementary',
    name: '2nd-elementary',
    displayName: '2° Básico',
    stageId: 'elementary',
    order: 4,
  },
  {
    id: '3rd-elementary',
    name: '3rd-elementary',
    displayName: '3° Básico',
    stageId: 'elementary',
    order: 5,
  },
  {
    id: '4th-elementary',
    name: '4th-elementary',
    displayName: '4° Básico',
    stageId: 'elementary',
    order: 6,
  },
  {
    id: '5th-elementary',
    name: '5th-elementary',
    displayName: '5° Básico',
    stageId: 'elementary',
    order: 7,
  },
  {
    id: '6th-elementary',
    name: '6th-elementary',
    displayName: '6° Básico',
    stageId: 'elementary',
    order: 8,
  },
  {
    id: '7th-elementary',
    name: '7th-elementary',
    displayName: '7° Básico',
    stageId: 'elementary',
    order: 9,
  },
  {
    id: '8th-elementary',
    name: '8th-elementary',
    displayName: '8° Básico',
    stageId: 'elementary',
    order: 10,
  },

  // Secondary
  {
    id: '1st-secondary',
    name: '1st-secondary',
    displayName: '1° Medio',
    stageId: 'secondary',
    order: 11,
  },
  {
    id: '2nd-secondary',
    name: '2nd-secondary',
    displayName: '2° Medio',
    stageId: 'secondary',
    order: 12,
  },
  {
    id: '3rd-secondary',
    name: '3rd-secondary',
    displayName: '3° Medio',
    stageId: 'secondary',
    order: 13,
  },
  {
    id: '4th-secondary',
    name: '4th-secondary',
    displayName: '4° Medio',
    stageId: 'secondary',
    order: 14,
  },
];

// Function to seed the database
export async function seedDatabase(db: D1Database) {
  const drizzleDb = drizzle(db);

  console.log('Seeding stages...');
  for (const stage of stagesData) {
    await drizzleDb.insert(stages).values(stage).onConflictDoNothing();
  }

  console.log('Seeding grades...');
  for (const grade of gradesData) {
    await drizzleDb.insert(grades).values(grade).onConflictDoNothing();
  }

  console.log('Database seeded successfully!');
}
