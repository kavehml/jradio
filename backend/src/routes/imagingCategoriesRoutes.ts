import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { ImagingCategory } from '../db/models/ImagingCategory';
import { ImagingSubCategory } from '../db/models/ImagingSubCategory';

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

router.get('/subcategories', requireAuth, async (_req, res) => {
  try {
    const subCategories = await ImagingSubCategory.findAll({
      order: [['categoryId', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'categoryId', 'name'],
    });
    return res.json({ subCategories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load subcategories' });
  }
});

router.get('/subcategories/public', async (_req, res) => {
  try {
    const subCategories = await ImagingSubCategory.findAll({
      order: [['categoryId', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'categoryId', 'name'],
    });
    return res.json({ subCategories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load subcategories' });
  }
});

router.post('/:categoryId/subcategories', requireAuth, requireRole(['admin']), async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const { name } = req.body as { name?: string };
  if (!Number.isFinite(categoryId) || !name?.trim()) {
    return res.status(400).json({ error: 'categoryId and name are required' });
  }
  try {
    const [subCategory] = await ImagingSubCategory.findOrCreate({
      where: { categoryId, name: name.trim() },
      defaults: { categoryId, name: name.trim() },
    });
    return res.status(201).json({ id: subCategory.id, categoryId: subCategory.categoryId, name: subCategory.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

export default router;
