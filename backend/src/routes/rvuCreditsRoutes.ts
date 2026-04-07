import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { RvuCreditEntry } from '../db/models/RvuCreditEntry';
import { User } from '../db/models/User';

const router = Router();

router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const where: { applyDate?: { [Op.between]: [string, string] } } = {};
  if (from && to) where.applyDate = { [Op.between]: [from, to] };
  try {
    const entries = await RvuCreditEntry.findAll({
      where,
      include: [{ model: User, as: 'radiologist', attributes: ['id', 'name'] }],
      order: [['applyDate', 'DESC'], ['id', 'DESC']],
    });
    return res.json({ entries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load RVU credits' });
  }
});

router.post('/', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  const { radiologistId, creditType, amount, applyDate, note } = req.body as {
    radiologistId?: number;
    creditType?: 'earned' | 'given';
    amount?: number;
    applyDate?: string;
    note?: string;
  };

  const radId = Number(radiologistId);
  const amountNumber = Number(amount);
  if (!Number.isInteger(radId) || !creditType || !Number.isFinite(amountNumber) || !applyDate) {
    return res.status(400).json({ error: 'radiologistId, creditType, amount, and applyDate are required' });
  }
  if (!['earned', 'given'].includes(creditType)) {
    return res.status(400).json({ error: 'creditType must be earned or given' });
  }
  const rounded = Math.round(amountNumber);
  if (rounded <= 0) {
    return res.status(400).json({ error: 'amount must be a positive integer' });
  }

  try {
    const radiologist = await User.findByPk(radId);
    if (!radiologist || radiologist.role !== 'radiologist') {
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    const created = await RvuCreditEntry.create({
      radiologistId: radId,
      creditType,
      amount: rounded,
      applyDate,
      note: note?.trim() || null,
      createdByUserId: req.user!.id,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create RVU credit' });
  }
});

export default router;
