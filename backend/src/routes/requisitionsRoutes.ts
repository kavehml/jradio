import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { createRequisition, resolveRequiredSubspecialties } from '../services/requisitionService';
import { Requisition } from '../db/models/Requisition';
import { Visit } from '../db/models/Visit';
import { RequisitionImagingItem } from '../db/models/RequisitionImagingItem';
import { RequisitionSpecialtyRequirement } from '../db/models/RequisitionSpecialtyRequirement';
import { ImagingCategory } from '../db/models/ImagingCategory';

const router = Router();

function computeRvuForImaging(bodyParts: string[], modality: string): number {
  if (modality.toLowerCase() === 'angio') return 3;
  if (bodyParts.length <= 1) return 1;
  return 2;
}

function parseSubCategoriesFromNotes(notes?: string | null): string[] {
  if (!notes) return [];

  const lines = notes.split(/\r?\n/);
  const examsIndex = lines.findIndex((l) => /^Exams:/i.test(l.trim()));
  if (examsIndex >= 0) {
    const values: string[] = [];
    const firstLineRemainder = (lines[examsIndex] ?? '').replace(/^Exams:\s*/i, '').trim();
    if (firstLineRemainder && !firstLineRemainder.startsWith('-')) {
      values.push(
        ...firstLineRemainder
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
    for (let i = examsIndex + 1; i < lines.length; i += 1) {
      const line = (lines[i] ?? '').trim();
      if (!line) continue;
      if (line.startsWith('- ')) {
        const value = line.slice(2).trim();
        if (value) values.push(value);
        continue;
      }
      break;
    }
    if (values.length) return Array.from(new Set(values));
  }

  const legacyMatch = notes.match(/Exams:\s*([^·\n]+)/i);
  if (!legacyMatch?.[1]) return [];
  return Array.from(
    new Set(
      legacyMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function stripManagedPrefixes(notes?: string | null): string {
  if (!notes) return '';
  const withoutExamHeader = notes.replace(/Exams:\s*([^\n]*)(\n|$)/gi, '');
  const withoutExamBullets = withoutExamHeader.replace(/^\s*-\s+.*$/gim, '');
  return withoutExamBullets
    .replace(/^Notes:\s*/i, '')
    .replace(/^\s*·\s*/g, '')
    .trim();
}

function mergeExamNotes(selectedSubCategories: string[], notes?: string | null): string | null {
  const stripped = stripManagedPrefixes(notes);
  if (!selectedSubCategories.length) return stripped || null;
  const examBlock = `Exams:\n${selectedSubCategories.map((s) => `- ${s}`).join('\n')}`;
  return stripped ? `${examBlock}\nNotes: ${stripped}` : examBlock;
}

function validateAndBuildParams(body: {
  patientIdOrTempLabel?: string;
  patientName?: string;
  patientDateOfBirth?: string;
  isNewExternalPatient?: boolean;
  orderingDoctorName?: string;
  orderingClinic?: string;
  site?: string;
  dateOfRequest?: string;
  timeDelayPreset?: string;
  hasImagingWithin24h?: boolean;
  categoryId?: number;
  modality?: string;
  bodyParts?: string[];
  withContrast?: boolean;
  notes?: string;
  selectedSubCategories?: string[];
}) {
  if (
    !body.patientIdOrTempLabel ||
    !body.orderingDoctorName ||
    !body.orderingClinic ||
    !body.site ||
    body.categoryId == null ||
    !body.modality
  ) {
    return {
      error:
        'Missing required fields: patientIdOrTempLabel, orderingDoctorName, orderingClinic, site, categoryId, modality',
    } as const;
  }

  const params = {
    patientIdOrTempLabel: body.patientIdOrTempLabel,
    ...(body.patientName !== undefined && body.patientName !== '' && { patientName: body.patientName }),
    ...(body.patientDateOfBirth !== undefined &&
      body.patientDateOfBirth !== '' && { patientDateOfBirth: body.patientDateOfBirth }),
    isNewExternalPatient: !!body.isNewExternalPatient,
    orderingDoctorName: body.orderingDoctorName,
    orderingClinic: body.orderingClinic,
    site: body.site,
    categoryId: body.categoryId,
    modality: body.modality,
    bodyParts: Array.isArray(body.bodyParts) ? body.bodyParts : [body.modality],
    ...(body.dateOfRequest !== undefined && body.dateOfRequest !== '' && { dateOfRequest: body.dateOfRequest }),
    ...(body.timeDelayPreset !== undefined &&
      body.timeDelayPreset !== '' && { timeDelayPreset: body.timeDelayPreset }),
    ...(body.hasImagingWithin24h !== undefined && { hasImagingWithin24h: body.hasImagingWithin24h }),
    ...(body.withContrast !== undefined && { withContrast: body.withContrast }),
    ...(body.notes !== undefined && body.notes !== '' && { notes: body.notes }),
    ...(Array.isArray(body.selectedSubCategories) && {
      selectedSubCategories: body.selectedSubCategories,
    }),
  };

  return { params } as const;
}

// Internal, authenticated requisition creation (clerical / admin)
router.post('/', requireAuth, requireRole(['admin', 'clerical']), async (req, res) => {
  const body = req.body as {
    patientIdOrTempLabel?: string;
    patientName?: string;
    patientDateOfBirth?: string;
    isNewExternalPatient?: boolean;
    orderingDoctorName?: string;
    orderingClinic?: string;
    site?: string;
    dateOfRequest?: string;
    timeDelayPreset?: string;
    hasImagingWithin24h?: boolean;
    categoryId?: number;
    modality?: string;
    bodyParts?: string[];
    withContrast?: boolean;
    notes?: string;
    selectedSubCategories?: string[];
  };

  const validated = validateAndBuildParams(body);
  if ('error' in validated) {
    return res.status(400).json({ error: validated.error });
  }

  try {
    const result = await createRequisition(validated.params);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create requisition' });
  }
});

// Public requisition creation endpoint for external clinics (no auth)
router.post('/public', async (req, res) => {
  const body = req.body as {
    patientIdOrTempLabel?: string;
    patientName?: string;
    patientDateOfBirth?: string;
    isNewExternalPatient?: boolean;
    orderingDoctorName?: string;
    orderingClinic?: string;
    site?: string;
    dateOfRequest?: string;
    timeDelayPreset?: string;
    hasImagingWithin24h?: boolean;
    categoryId?: number;
    modality?: string;
    bodyParts?: string[];
    withContrast?: boolean;
    notes?: string;
    selectedSubCategories?: string[];
  };

  const validated = validateAndBuildParams(body);
  if ('error' in validated) {
    return res.status(400).json({ error: validated.error });
  }

  try {
    const result = await createRequisition(validated.params);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create requisition' });
  }
});

// List requisitions for admins/clerical
router.get('/', requireAuth, requireRole(['admin', 'clerical']), async (_req, res) => {
  try {
    const requisitions = await Requisition.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: Visit,
          as: 'visit',
          attributes: ['visitNumber', 'scheduledDateTime'],
        },
        {
          model: RequisitionImagingItem,
          as: 'imagingItems',
          attributes: ['rvuValue', 'modality', 'categoryId', 'specialNotes'],
          include: [{ model: ImagingCategory, as: 'category', attributes: ['id', 'name'] }],
        },
        {
          model: RequisitionSpecialtyRequirement,
          as: 'specialtyRequirement',
          attributes: ['requiredSubspecialties'],
        },
      ],
      attributes: [
        'id',
        'patientIdOrTempLabel',
        'patientName',
        'patientDateOfBirth',
        'orderingDoctorName',
        'orderingClinic',
        'site',
        'status',
        'calculatedDueDate',
        'createdAt',
      ],
    });
    return res.json({ requisitions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load requisitions' });
  }
});

// Update due date and shift (scheduledDateTime) for a requisition
router.patch('/:id/schedule', requireAuth, requireRole(['admin', 'radiologist']), async (req, res) => {
  const id = Number(req.params.id);
  const { dueDate, shift } = req.body as { dueDate?: string; shift?: 'AM' | 'PM' | 'NIGHT' | 'NA' };
  if (!Number.isFinite(id) || !dueDate || !shift) {
    return res.status(400).json({ error: 'dueDate and shift are required' });
  }
  const baseDate = new Date(dueDate);
  if (Number.isNaN(baseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid dueDate' });
  }
  const scheduled = new Date(baseDate);
  if (shift === 'AM') scheduled.setHours(8, 0, 0, 0);
  if (shift === 'PM') scheduled.setHours(16, 0, 0, 0);
  if (shift === 'NIGHT') scheduled.setHours(0, 0, 0, 0);

  try {
    const reqn = await Requisition.findByPk(id);
    if (!reqn) return res.status(404).json({ error: 'Requisition not found' });
    reqn.calculatedDueDate = baseDate;
    await reqn.save();

    const visit = await Visit.findOne({ where: { requisitionId: id } });
    if (visit) {
      visit.scheduledDateTime = shift === 'NA' ? null : scheduled;
      await visit.save();
    }

    return res.json({
      id: reqn.id,
      calculatedDueDate: reqn.calculatedDueDate,
      scheduledDateTime: visit?.scheduledDateTime ?? null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Update imaging category/subcategories before approval
router.patch('/:id/imaging', requireAuth, requireRole(['admin', 'radiologist']), async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as {
    modality?: string;
    categoryId?: number;
    selectedSubCategories?: string[];
    notes?: string;
  };
  if (!Number.isFinite(id) || !body.modality || body.categoryId == null) {
    return res.status(400).json({ error: 'modality and categoryId are required' });
  }
  try {
    const reqn = await Requisition.findByPk(id);
    if (!reqn) return res.status(404).json({ error: 'Requisition not found' });
    let item = await RequisitionImagingItem.findOne({ where: { requisitionId: id } });

    const category = await ImagingCategory.findByPk(body.categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const selectedSubCategories = Array.isArray(body.selectedSubCategories)
      ? body.selectedSubCategories.filter(Boolean)
      : [];

    if (!item) {
      item = await RequisitionImagingItem.create({
        requisitionId: id,
        modality: body.modality,
        categoryId: body.categoryId,
        bodyParts: [category.bodyPart],
        withContrast: false,
        specialNotes: mergeExamNotes(selectedSubCategories, body.notes),
        rvuValue: computeRvuForImaging([category.bodyPart], body.modality),
      });
    } else {
      item.modality = body.modality;
      item.categoryId = body.categoryId;
      item.bodyParts = [category.bodyPart];
      item.specialNotes = mergeExamNotes(selectedSubCategories, body.notes ?? item.specialNotes);
      await item.save();
    }

    let requirement = await RequisitionSpecialtyRequirement.findOne({
      where: { requisitionId: id },
    });
    const requiredSubspecialties = await resolveRequiredSubspecialties({
      modality: body.modality,
      categoryId: body.categoryId,
      selectedSubCategories,
    });
    if (!requirement) {
      requirement = await RequisitionSpecialtyRequirement.create({
        requisitionId: id,
        requiredSubspecialties,
      });
    } else {
      requirement.requiredSubspecialties = requiredSubspecialties;
      await requirement.save();
    }

    return res.json({
      requisitionId: id,
      modality: item.modality,
      categoryId: item.categoryId,
      selectedSubCategories,
      requiredSubspecialties: requirement.requiredSubspecialties,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update requisition imaging details' });
  }
});

// Approve requisition
router.patch('/:id/approve', requireAuth, requireRole(['admin', 'radiologist']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid requisition id' });
  try {
    const reqn = await Requisition.findByPk(id);
    if (!reqn) return res.status(404).json({ error: 'Requisition not found' });
    reqn.status = 'approved';
    await reqn.save();
    return res.json({ id: reqn.id, status: reqn.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to approve requisition' });
  }
});

// Manually update RVU value for a requisition's imaging item
router.patch('/:id/rvu', requireAuth, requireRole(['admin', 'radiologist']), async (req, res) => {
  const id = Number(req.params.id);
  const { rvuValue } = req.body as { rvuValue?: number };
  if (!Number.isFinite(id) || typeof rvuValue !== 'number' || rvuValue < 1 || rvuValue > 3) {
    return res.status(400).json({ error: 'rvuValue must be between 1 and 3' });
  }
  try {
    const item = await RequisitionImagingItem.findOne({ where: { requisitionId: id } });
    if (!item) return res.status(404).json({ error: 'Imaging item not found for requisition' });
    item.rvuValue = rvuValue;
    await item.save();
    return res.json({ requisitionId: id, rvuValue: item.rvuValue });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update RVU' });
  }
});

// Update additional notes for requisition imaging item
router.patch('/:id/notes', requireAuth, requireRole(['admin', 'radiologist', 'clerical']), async (req, res) => {
  const id = Number(req.params.id);
  const { notes } = req.body as { notes?: string };
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid requisition id' });
  try {
    const reqn = await Requisition.findByPk(id);
    if (!reqn) return res.status(404).json({ error: 'Requisition not found' });

    let item = await RequisitionImagingItem.findOne({ where: { requisitionId: id } });
    if (!item) {
      item = await RequisitionImagingItem.create({
        requisitionId: id,
        modality: 'Unknown',
        bodyParts: [],
        withContrast: false,
        specialNotes: notes?.trim() ? notes.trim() : null,
        rvuValue: 1,
        categoryId: null,
      });
    } else {
      const exams = parseSubCategoriesFromNotes(item.specialNotes);
      item.specialNotes = mergeExamNotes(exams, notes?.trim() || null);
      await item.save();
    }
    return res.json({ requisitionId: id, notes: item.specialNotes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update notes' });
  }
});

// Delete requisition
router.delete('/:id', requireAuth, requireRole(['admin', 'clerical']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid requisition id' });
  try {
    const deleted = await Requisition.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'Requisition not found' });
    return res.json({ deleted: 1 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete requisition' });
  }
});

export default router;
