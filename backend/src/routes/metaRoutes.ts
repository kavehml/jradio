import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { Clinic } from '../db/models/Clinic';
import { SiteLocation } from '../db/models/SiteLocation';
import { TimeDelayOption } from '../db/models/TimeDelayOption';

const router = Router();

const DEFAULT_TIME_DELAY_OPTIONS = [
  { code: '24h', label: '24 hours', hours: 24 },
  { code: '7d', label: '7 days', hours: 7 * 24 },
  { code: '30d', label: '30 days', hours: 30 * 24 },
  { code: '3m', label: '3 months', hours: 90 * 24 },
];

async function ensureTimeDelayDefaults() {
  const count = await TimeDelayOption.count();
  if (count > 0) return;
  await TimeDelayOption.bulkCreate(DEFAULT_TIME_DELAY_OPTIONS);
}

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

router.get('/time-delay-options', requireAuth, async (_req, res) => {
  try {
    await ensureTimeDelayDefaults();
    const options = await TimeDelayOption.findAll({
      where: { active: true },
      order: [['hours', 'ASC']],
      attributes: ['id', 'code', 'label', 'hours'],
    });
    return res.json({ options });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load time delay options' });
  }
});

router.post('/time-delay-options', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body as { label?: string; hours?: number };
  const label = body.label?.trim();
  const hours = Number(body.hours);
  if (!label || !Number.isFinite(hours) || hours <= 0) {
    return res.status(400).json({ error: 'Valid label and hours are required' });
  }
  try {
    const base = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'custom_delay';
    let code = base;
    let attempt = 1;
    while (await TimeDelayOption.findOne({ where: { code }, attributes: ['id'] })) {
      attempt += 1;
      code = `${base}_${attempt}`;
    }
    const created = await TimeDelayOption.create({ code, label, hours, active: true });
    return res.status(201).json({
      id: created.id,
      code: created.code,
      label: created.label,
      hours: created.hours,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create time delay option' });
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

router.get('/public/time-delay-options', async (_req, res) => {
  try {
    await ensureTimeDelayDefaults();
    const options = await TimeDelayOption.findAll({
      where: { active: true },
      order: [['hours', 'ASC']],
      attributes: ['id', 'code', 'label', 'hours'],
    });
    return res.json({ options });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load time delay options' });
  }
});

export default router;

