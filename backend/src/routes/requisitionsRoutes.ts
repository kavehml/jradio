import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { createRequisition } from '../services/requisitionService';
import { Requisition } from '../db/models/Requisition';
import { Visit } from '../db/models/Visit';

const router = Router();

function validateAndBuildParams(body: {
  patientIdOrTempLabel?: string;
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
  };

  return { params } as const;
}

// Internal, authenticated requisition creation (clerical / admin)
router.post('/', requireAuth, requireRole(['admin', 'clerical']), async (req, res) => {
  const body = req.body as {
    patientIdOrTempLabel?: string;
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
          attributes: ['visitNumber'],
        },
      ],
      attributes: [
        'id',
        'patientIdOrTempLabel',
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

export default router;
