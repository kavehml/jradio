import { Router } from 'express';
import { SpecialtyRule } from '../db/models/SpecialtyRule';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, requireRole(['admin']), async (_req, res) => {
  try {
    const rules = await SpecialtyRule.findAll({
      order: [['modality', 'ASC'], ['categoryName', 'ASC'], ['subCategory', 'ASC']],
    });
    return res.json({ rules });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load specialty rules' });
  }
});

router.put('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body as {
    modality?: string;
    categoryName?: string;
    subCategory?: string | null;
    requiredSubspecialties?: string[];
  };
  if (
    !body.modality ||
    !body.categoryName ||
    !body.subCategory ||
    !Array.isArray(body.requiredSubspecialties)
  ) {
    return res
      .status(400)
      .json({ error: 'modality, categoryName, subCategory, requiredSubspecialties are required' });
  }
  const required = body.requiredSubspecialties.length ? body.requiredSubspecialties : ['general'];
  try {
    const existing = await SpecialtyRule.findOne({
      where: {
        modality: body.modality,
        categoryName: body.categoryName,
        subCategory: body.subCategory,
      },
    });
    if (existing) {
      existing.requiredSubspecialties = required;
      await existing.save();
      return res.json(existing);
    }
    const created = await SpecialtyRule.create({
      modality: body.modality,
      categoryName: body.categoryName,
      subCategory: body.subCategory,
      requiredSubspecialties: required,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save specialty rule' });
  }
});

export default router;
