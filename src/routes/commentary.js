
import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
  try {
    // Validate params
    const params = matchIdParamSchema.safeParse({ id: req.params.id });
    if (!params.success) {
      return res.status(400).json({ error: 'Invalid match id', details: params.error.errors });
    }

    // Validate query
    const query = listCommentaryQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: 'Invalid query', details: query.error.errors });
    }

    const MAX_LIMIT = 100;
    const limit = query.data.limit ?? MAX_LIMIT;

    // Fetch commentary for the match, newest first

    const results = await db.select()
      .from(commentary)
      .where(eq(commentary.matchId, params.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(Math.min(limit, MAX_LIMIT));

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch commentary' });
  }
});

// POST /matches/:id/commentary
commentaryRouter.post('/', async (req, res) => {
  try {
    // Validate params
    const params = matchIdParamSchema.safeParse({ id: req.params.id });
    if (!params.success) {
      return res.status(400).json({ error: 'Invalid match id', details: params.error.errors });
    }

    // Validate body
    const body = createCommentarySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Invalid commentary data', details: body.error.errors });
    }

    // Prepare insert data
    const insertData = {
      matchId: params.data.id,
      ...body.data,
    };

    // Insert into commentary table
    const [result] = await db.insert(commentary).values(insertData).returning();
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create commentary' });
  }
});