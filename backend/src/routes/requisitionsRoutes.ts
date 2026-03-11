import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { createRequisition } from '../services/requisitionService';

const router = Router();

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

  if (
    !body.patientIdOrTempLabel ||
    !body.orderingDoctorName ||
    !body.orderingClinic ||
    !body.site ||
    body.categoryId == null ||
    !body.modality
  ) {
    return res.status(400).json({
      error: 'Missing required fields: patientIdOrTempLabel, orderingDoctorName, orderingClinic, site, categoryId, modality',
    });
  }

  try {
    const result = await createRequisition({
      patientIdOrTempLabel: body.patientIdOrTempLabel,
      isNewExternalPatient: !!body.isNewExternalPatient,
      orderingDoctorName: body.orderingDoctorName,
      orderingClinic: body.orderingClinic,
      site: body.site,
      dateOfRequest: body.dateOfRequest,
      timeDelayPreset: body.timeDelayPreset,
      hasImagingWithin24h: body.hasImagingWithin24h,
      categoryId: body.categoryId,
      modality: body.modality,
      bodyParts: Array.isArray(body.bodyParts) ? body.bodyParts : [body.modality],
      withContrast: body.withContrast,
      notes: body.notes,
    });
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create requisition' });
  }
});

export default router;
