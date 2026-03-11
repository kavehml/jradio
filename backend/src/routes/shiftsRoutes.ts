import { Router } from 'express';
import { Op } from 'sequelize';
import { ShiftAssignment, ShiftType } from '../db/models/ShiftAssignment';
import { User } from '../db/models/User';
import { AuthRequest, requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

function getRange(query: { from?: string; to?: string }) {
  const from = query.from || new Date().toISOString().slice(0, 10);
  const defaultTo = new Date();
  defaultTo.setDate(defaultTo.getDate() + 30);
  const to = query.to || defaultTo.toISOString().slice(0, 10);
  return { from, to };
}

router.get('/mine', requireAuth, requireRole(['radiologist', 'admin']), async (req: AuthRequest, res) => {
  const { from, to } = getRange(req.query as { from?: string; to?: string });
  try {
    const shifts = await ShiftAssignment.findAll({
      where: {
        radiologistId: req.user!.id,
        date: { [Op.between]: [from, to] },
      },
      order: [['date', 'ASC'], ['shiftType', 'ASC']],
      attributes: ['id', 'date', 'shiftType', 'site', 'maxRvu'],
    });
    return res.json({ shifts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load shifts' });
  }
});

router.post('/mine', requireAuth, requireRole(['radiologist', 'admin']), async (req: AuthRequest, res) => {
  const { date, shiftType, site } = req.body as { date?: string; shiftType?: ShiftType; site?: string };
  if (!date || !shiftType) {
    return res.status(400).json({ error: 'date and shiftType are required' });
  }
  if (!['AM', 'PM', 'NIGHT'].includes(shiftType)) {
    return res.status(400).json({ error: 'shiftType must be AM, PM, or NIGHT' });
  }
  try {
    const existing = await ShiftAssignment.findOne({
      where: { radiologistId: req.user!.id, date, shiftType },
    });
    if (existing) {
      existing.site = site || existing.site || 'General';
      await existing.save();
      return res.json(existing);
    }
    const created = await ShiftAssignment.create({
      radiologistId: req.user!.id,
      date: new Date(date),
      shiftType,
      site: site || 'General',
      maxRvu: null,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save shift' });
  }
});

router.delete('/mine', requireAuth, requireRole(['radiologist', 'admin']), async (req: AuthRequest, res) => {
  const { date, shiftType } = req.body as { date?: string; shiftType?: ShiftType };
  if (!date || !shiftType) {
    return res.status(400).json({ error: 'date and shiftType are required' });
  }
  try {
    const deleted = await ShiftAssignment.destroy({
      where: { radiologistId: req.user!.id, date, shiftType },
    });
    return res.json({ deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete shift' });
  }
});

router.get('/summary', requireAuth, requireRole(['admin']), async (req, res) => {
  const { from, to } = getRange(req.query as { from?: string; to?: string });
  try {
    const shifts = await ShiftAssignment.findAll({
      where: { date: { [Op.between]: [from, to] } },
      include: [{ model: User, as: 'radiologist', attributes: ['id', 'name'] }],
      order: [['date', 'ASC'], ['shiftType', 'ASC']],
      attributes: ['id', 'date', 'shiftType', 'site'],
    });
    return res.json({ shifts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load shift summary' });
  }
});

export default router;
