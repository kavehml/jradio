import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { computeBacklogSummary, returnStaleAssignmentsToPool } from '../services/backlogService';

const router = Router();

router.get('/summary', requireAuth, requireRole(['admin']), async (_req, res) => {
  const summary = await computeBacklogSummary();
  return res.json({ summary });
});

router.post('/return-to-pool', requireAuth, requireRole(['admin']), async (req, res) => {
  const { maxAssignmentMinutes } = req.body;
  const minutes = typeof maxAssignmentMinutes === 'number' ? maxAssignmentMinutes : 120; // default 2h

  const result = await returnStaleAssignmentsToPool({ maxAssignmentMinutes: minutes });
  return res.json(result);
});

export default router;
