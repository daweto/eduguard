import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';
import { stages, grades } from '../db/schema';

const gradesRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/grades/stages - Get all stages
gradesRouter.get('/stages', async (c) => {
  try {
    const db = drizzle(c.env.DB);

    const stagesList = await db
      .select()
      .from(stages)
      .orderBy(stages.order);

    return c.json({ stages: stagesList });
  } catch (error) {
    console.error('Error fetching stages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/grades - Get all grades (optionally filtered by stage)
gradesRouter.get('/', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const stageId = c.req.query('stage_id');

    let gradesList;
    if (stageId) {
      gradesList = await db
        .select()
        .from(grades)
        .where(eq(grades.stageId, stageId))
        .orderBy(grades.order);
    } else {
      gradesList = await db
        .select()
        .from(grades)
        .orderBy(grades.order);
    }

    return c.json({ grades: gradesList });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/grades/:id - Get single grade with stage info
gradesRouter.get('/:id', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const gradeId = c.req.param('id');

    const grade = await db
      .select({
        grade: grades,
        stage: stages,
      })
      .from(grades)
      .leftJoin(stages, eq(grades.stageId, stages.id))
      .where(eq(grades.id, gradeId))
      .limit(1);

    if (!grade || grade.length === 0) {
      return c.json({ error: 'Grade not found' }, 404);
    }

    return c.json(grade[0]);
  } catch (error) {
    console.error('Error fetching grade:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default gradesRouter;
