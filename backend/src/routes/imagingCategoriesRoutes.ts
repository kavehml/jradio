import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { ImagingCategory } from '../db/models/ImagingCategory';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const categories = await ImagingCategory.findAll({
    order: [['modality', 'ASC'], ['name', 'ASC']],
    attributes: ['id', 'name', 'modality', 'bodyPart', 'imagePath', 'isSubspecialtyRestricted'],
  });
  return res.json(categories);
});

export default router;
