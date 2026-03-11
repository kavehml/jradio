import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { ImagingCategory } from '../db/models/ImagingCategory';

const router = Router();

// Authenticated endpoint used by internal app
router.get('/', requireAuth, async (_req, res) => {
  const categories = await ImagingCategory.findAll({
    order: [['modality', 'ASC'], ['name', 'ASC']],
    attributes: ['id', 'name', 'modality', 'bodyPart', 'imagePath', 'isSubspecialtyRestricted'],
  });
  return res.json(categories);
});

// Public read‑only endpoint for external requisition form
router.get('/public', async (_req, res) => {
  const categories = await ImagingCategory.findAll({
    order: [['modality', 'ASC'], ['name', 'ASC']],
    attributes: ['id', 'name', 'modality', 'bodyPart', 'imagePath', 'isSubspecialtyRestricted'],
  });
  return res.json(categories);
});

export default router;
