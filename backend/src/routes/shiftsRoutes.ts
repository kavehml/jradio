import { Router } from 'express';
import { Op } from 'sequelize';
import { ShiftAssignment, ShiftType } from '../db/models/ShiftAssignment';
import { User } from '../db/models/User';
import { AuthRequest, requireAuth, requireRole } from '../middleware/authMiddleware';
import { RvuCreditEntry } from '../db/models/RvuCreditEntry';

const router = Router();

function getRange(query: { from?: string; to?: string }) {
  const from = query.from || new Date().toISOString().slice(0, 10);
  const defaultTo = new Date();
  defaultTo.setDate(defaultTo.getDate() + 30);
  const to = query.to || defaultTo.toISOString().slice(0, 10);
  return { from, to };
}

function resolveTargetRadiologistId(
  req: AuthRequest,
  value: unknown
): number {
  if (req.user?.role === 'admin' && value !== undefined && value !== null && value !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return req.user!.id;
}

async function loadCreditsByRadiologistDate(params: {
  from: string;
  to: string;
  radiologistIds?: number[];
}) {
  const where: {
    applyDate: { [Op.between]: [string, string] };
    radiologistId?: { [Op.in]: number[] };
  } = {
    applyDate: { [Op.between]: [params.from, params.to] },
  };
  if (params.radiologistIds?.length) {
    where.radiologistId = { [Op.in]: params.radiologistIds };
  }
  const credits = await RvuCreditEntry.findAll({
    where,
    attributes: ['radiologistId', 'applyDate', 'amount'],
  });
  const map = new Map<string, number>();
  credits.forEach((c) => {
    const k = `${c.radiologistId}_${String(c.applyDate)}`;
    map.set(k, (map.get(k) || 0) + c.amount);
  });
  return map;
}

router.get('/mine', requireAuth, requireRole(['radiologist', 'admin']), async (req: AuthRequest, res) => {
  const { from, to } = getRange(req.query as { from?: string; to?: string });
  const radiologistId = resolveTargetRadiologistId(req, (req.query as { radiologistId?: string }).radiologistId);
  try {
    const shifts = await ShiftAssignment.findAll({
      where: {
        radiologistId,
        date: { [Op.between]: [from, to] },
      },
      order: [['date', 'ASC'], ['shiftType', 'ASC']],
      attributes: ['id', 'date', 'shiftType', 'site', 'maxRvu'],
    });
    const creditsMap = await loadCreditsByRadiologistDate({ from, to, radiologistIds: [radiologistId] });
    const enriched = shifts.map((s) => {
      const creditAdjustment = creditsMap.get(`${radiologistId}_${String(s.date)}`) || 0;
      return {
        ...s.toJSON(),
        creditAdjustment,
        adjustedMaxRvu: (s.maxRvu || 0) + creditAdjustment,
      };
    });
    return res.json({ shifts: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load shifts' });
  }
});

router.post('/mine', requireAuth, requireRole(['radiologist', 'admin']), async (req: AuthRequest, res) => {
  const { date, shiftType, site, maxRvu } = req.body as {
    date?: string;
    shiftType?: ShiftType;
    site?: string;
    maxRvu?: number | null;
    radiologistId?: number;
  };
  const radiologistId = resolveTargetRadiologistId(req, req.body?.radiologistId);
  if (!date || !shiftType) {
    return res.status(400).json({ error: 'date and shiftType are required' });
  }
  if (!['AM', 'PM', 'NIGHT'].includes(shiftType)) {
    return res.status(400).json({ error: 'shiftType must be AM, PM, or NIGHT' });
  }
  try {
    const existing = await ShiftAssignment.findOne({
      where: { radiologistId, date, shiftType },
    });
    if (existing) {
      existing.site = site || existing.site || 'General';
      if (maxRvu !== undefined) {
        existing.maxRvu = maxRvu;
      }
      await existing.save();
      return res.json(existing);
    }
    const created = await ShiftAssignment.create({
      radiologistId,
      date: new Date(date),
      shiftType,
      site: site || 'General',
      maxRvu: maxRvu ?? null,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save shift' });
  }
});

router.delete('/mine', requireAuth, requireRole(['radiologist', 'admin']), async (req: AuthRequest, res) => {
  const { date, shiftType } = req.body as { date?: string; shiftType?: ShiftType; radiologistId?: number };
  const radiologistId = resolveTargetRadiologistId(req, req.body?.radiologistId);
  if (!date || !shiftType) {
    return res.status(400).json({ error: 'date and shiftType are required' });
  }
  try {
    const deleted = await ShiftAssignment.destroy({
      where: { radiologistId, date, shiftType },
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

router.get('/coverage', requireAuth, requireRole(['radiologist', 'admin']), async (req, res) => {
  const { from, to } = getRange(req.query as { from?: string; to?: string });
  try {
    const shifts = await ShiftAssignment.findAll({
      where: { date: { [Op.between]: [from, to] } },
      include: [{ model: User, as: 'radiologist', attributes: ['id', 'name'] }],
      order: [['date', 'ASC'], ['shiftType', 'ASC']],
      attributes: ['id', 'date', 'shiftType', 'site', 'maxRvu', 'radiologistId'],
    });
    const radiologistIds = Array.from(new Set(shifts.map((s) => s.radiologistId)));
    const creditsMap = await loadCreditsByRadiologistDate({ from, to, radiologistIds });

    const grouped: Record<
      string,
      {
        date: string;
        shiftType: ShiftType;
        radiologistCount: number;
        totalMaxRvu: number;
        radiologists: {
          id: number;
          name: string;
          maxRvu: number | null;
          creditAdjustment: number;
          adjustedMaxRvu: number;
        }[];
      }
    > = {};

    shifts.forEach((s) => {
      const date = String(s.date);
      const key = `${date}_${s.shiftType}`;
      if (!grouped[key]) {
        grouped[key] = {
          date,
          shiftType: s.shiftType,
          radiologistCount: 0,
          totalMaxRvu: 0,
          radiologists: [],
        };
      }
      const creditAdjustment = creditsMap.get(`${s.radiologistId}_${date}`) || 0;
      const adjustedMaxRvu = (s.maxRvu || 0) + creditAdjustment;
      grouped[key].radiologistCount += 1;
      grouped[key].totalMaxRvu += adjustedMaxRvu;
      grouped[key].radiologists.push({
        id: s.radiologistId,
        name: ((s as unknown as { radiologist?: { name?: string } }).radiologist?.name || 'Radiologist'),
        maxRvu: s.maxRvu,
        creditAdjustment,
        adjustedMaxRvu,
      });
    });

    return res.json({ coverage: Object.values(grouped) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load shift coverage' });
  }
});

export default router;
