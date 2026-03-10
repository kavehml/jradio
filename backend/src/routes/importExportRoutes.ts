import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { importOutpatientCsv, exportRvuSummaryCsv } from '../services/importExportService';

const router = Router();

// Admin or clerical can import outpatient schedules from CSV text
router.post('/outpatient-csv', requireAuth, requireRole(['admin', 'clerical']), async (req, res) => {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'csv string is required in body' });
  }

  try {
    const result = await importOutpatientCsv(csv);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// Admin can export RVU summary as CSV
router.get('/rvu-summary', requireAuth, requireRole(['admin']), async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
    return res.status(400).json({ error: 'from and to query params (ISO dates) are required' });
  }

  try {
    const csv = await exportRvuSummaryCsv(new Date(from), new Date(to));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rvu-summary.csv"');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate export CSV' });
  }
});

export default router;
