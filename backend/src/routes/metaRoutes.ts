import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { Clinic } from '../db/models/Clinic';
import { SiteLocation } from '../db/models/SiteLocation';

const router = Router();

// Clinics (authenticated)
router.get('/clinics', requireAuth, async (_req, res) => {
  try {
    const clinics = await Clinic.findAll({ order: [['name', 'ASC']] });
    return res.json({
      clinics: clinics.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load clinics' });
  }
});

router.post('/clinics', requireAuth, requireRole(['admin']), async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const [clinic] = await Clinic.findOrCreate({
      where: { name },
      defaults: { name },
    });
    return res.status(201).json({ id: clinic.id, name: clinic.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// Site locations (authenticated)
router.get('/sites', requireAuth, async (_req, res) => {
  try {
    const sites = await SiteLocation.findAll({ order: [['name', 'ASC']] });
    return res.json({
      sites: sites.map((s) => ({ id: s.id, name: s.name })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load sites' });
  }
});

router.post('/sites', requireAuth, requireRole(['admin']), async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const [site] = await SiteLocation.findOrCreate({
      where: { name },
      defaults: { name },
    });
    return res.status(201).json({ id: site.id, name: site.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create site' });
  }
});

// Public read‑only endpoints for external requisition form
router.get('/public/clinics', async (_req, res) => {
  try {
    const clinics = await Clinic.findAll({ order: [['name', 'ASC']] });
    return res.json({
      clinics: clinics.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load clinics' });
  }
});

router.get('/public/sites', async (_req, res) => {
  try {
    const sites = await SiteLocation.findAll({ order: [['name', 'ASC']] });
    return res.json({
      sites: sites.map((s) => ({ id: s.id, name: s.name })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load sites' });
  }
});

export default router;

