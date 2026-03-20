import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { createRequisition, resolveRequiredSubspecialties } from '../services/requisitionService';
import { Requisition } from '../db/models/Requisition';
import { Visit } from '../db/models/Visit';
import { RequisitionImagingItem } from '../db/models/RequisitionImagingItem';
import { RequisitionSpecialtyRequirement } from '../db/models/RequisitionSpecialtyRequirement';
import { ImagingCategory } from '../db/models/ImagingCategory';
import { ReportingAssignment } from '../db/models/Assignments';
import { ShiftAssignment, ShiftType } from '../db/models/ShiftAssignment';
import { User } from '../db/models/User';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';

const router = Router();
type AssigningShift = ShiftType | 'NA';

function parseIsoDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isShiftMatch(dt: Date, shift: ShiftType): boolean {
  const h = dt.getHours();
  if (shift === 'AM') return h >= 6 && h < 14;
  if (shift === 'PM') return h >= 14 && h < 22;
  return h >= 22 || h < 6;
}

async function loadShiftApprovedRequisitions(params: { date: string; shift: AssigningShift }) {
  const dayStart = parseIsoDateOnly(params.date);
  if (!dayStart) return [];
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const scheduledRaw = await Requisition.findAll({
    where: { status: 'approved' },
    include: [
      {
        model: Visit,
        as: 'visit',
        attributes: ['visitNumber', 'scheduledDateTime'],
        where: {
          scheduledDateTime: {
            [Op.gte]: dayStart,
            [Op.lt]: dayEnd,
          },
        },
      },
      {
        model: RequisitionImagingItem,
        as: 'imagingItems',
        attributes: ['rvuValue'],
      },
      {
        model: ReportingAssignment,
        as: 'reportingAssignments',
        required: false,
        where: { status: { [Op.in]: ['assigned', 'completed', 'returned_to_pool'] } },
        attributes: ['id', 'status', 'shiftId'],
      },
    ],
    attributes: ['id', 'patientIdOrTempLabel', 'calculatedDueDate'],
    order: [['id', 'ASC']],
  });

  const scheduled = scheduledRaw as Array<
    Requisition & {
      visit?: { visitNumber?: string | null; scheduledDateTime?: Date | string | null } | null;
      imagingItems?: Array<{ rvuValue?: number | null }>;
      reportingAssignments?: Array<{ id: number; status: string; shiftId?: number | null }>;
      calculatedDueDate?: Date | string | null;
    }
  >;

  const inShift = scheduled.filter((r) => {
    const scheduledDateTime = r.visit?.scheduledDateTime;
    if (!scheduledDateTime) return false;
    if (params.shift === 'NA') return true;
    return isShiftMatch(new Date(scheduledDateTime), params.shift);
  });

  if (params.shift !== 'NA') return inShift;

  // For full-day distribution, also include approved requisitions due that day with shift N/A.
  const unscheduledRaw = await Requisition.findAll({
    where: {
      status: 'approved',
      calculatedDueDate: {
        [Op.gte]: dayStart,
        [Op.lt]: dayEnd,
      },
    },
    include: [
      {
        model: Visit,
        as: 'visit',
        required: false,
        attributes: ['visitNumber', 'scheduledDateTime'],
      },
      {
        model: RequisitionImagingItem,
        as: 'imagingItems',
        attributes: ['rvuValue'],
      },
      {
        model: ReportingAssignment,
        as: 'reportingAssignments',
        required: false,
        where: { status: { [Op.in]: ['assigned', 'completed', 'returned_to_pool'] } },
        attributes: ['id', 'status', 'shiftId'],
      },
    ],
    attributes: ['id', 'patientIdOrTempLabel', 'calculatedDueDate'],
    order: [['id', 'ASC']],
  });

  const unscheduled = unscheduledRaw as Array<
    Requisition & {
      visit?: { visitNumber?: string | null; scheduledDateTime?: Date | string | null } | null;
      imagingItems?: Array<{ rvuValue?: number | null }>;
      reportingAssignments?: Array<{ id: number; status: string; shiftId?: number | null }>;
      calculatedDueDate?: Date | string | null;
    }
  >;

  const unscheduledOnly = unscheduled.filter((r) => !r.visit?.scheduledDateTime);
  const merged = new Map<number, (typeof unscheduledOnly)[number]>();
  inShift.forEach((r) => merged.set(r.id, r));
  unscheduledOnly.forEach((r) => merged.set(r.id, r));
  return Array.from(merged.values()).sort((a, b) => a.id - b.id);
}

function getShiftPriority(shiftType: ShiftType): number {
  if (shiftType === 'AM') return 1;
  if (shiftType === 'PM') return 2;
  return 3;
}

function buildParticipantShiftMap(shifts: Array<{ id: number; radiologistId: number; shiftType: ShiftType }>) {
  const map = new Map<number, number>();
  const sorted = [...shifts].sort((a, b) => getShiftPriority(a.shiftType) - getShiftPriority(b.shiftType));
  sorted.forEach((s) => {
    if (!map.has(s.radiologistId)) {
      map.set(s.radiologistId, s.id);
    }
  });
  return map;
}

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function formatDob(value: Date | string | null | undefined): string {
  const iso = toDateOnly(value);
  return iso || '—';
}

function filterAssignmentsForDateShift<
  T extends ReportingAssignment & {
    shift?: { date?: Date | string | null; shiftType?: ShiftType | null } | null;
    requisition?: {
      calculatedDueDate?: Date | string | null;
      visit?: { scheduledDateTime?: Date | string | null } | null;
    } | null;
  }
>(
  assignments: T[],
  date: string,
  shift: AssigningShift
) {
  return assignments.filter((assignment) => {
    const shiftDate = toDateOnly(assignment.shift?.date);
    const visitDate = toDateOnly(assignment.requisition?.visit?.scheduledDateTime);
    const dueDate = toDateOnly(assignment.requisition?.calculatedDueDate);
    const inDate = shiftDate === date || visitDate === date || dueDate === date;
    if (!inDate) return false;
    if (shift === 'NA') return true;
    const shiftType = assignment.shift?.shiftType;
    if (shiftType) return shiftType === shift;
    const visitTime = assignment.requisition?.visit?.scheduledDateTime
      ? new Date(assignment.requisition.visit.scheduledDateTime)
      : null;
    return visitTime ? isShiftMatch(visitTime, shift) : false;
  });
}

function weightedDistribute(
  requisitions: Array<{ id: number; rvuValue: number }>,
  participants: Array<{ radiologistId: number; weight: number }>
) {
  const usableParticipants = participants.filter((p) => Number.isFinite(p.weight) && p.weight > 0);
  const totalWeight = usableParticipants.reduce((sum, p) => sum + p.weight, 0);
  if (!usableParticipants.length || totalWeight <= 0) return [];

  const totalRvu = requisitions.reduce((sum, r) => sum + (r.rvuValue || 1), 0);
  const state = usableParticipants.map((p) => ({
    radiologistId: p.radiologistId,
    weight: p.weight,
    targetRvu: (totalRvu * p.weight) / totalWeight,
    assignedRvu: 0,
    requisitionIds: [] as number[],
  }));

  const ordered = [...requisitions].sort((a, b) => b.rvuValue - a.rvuValue);
  ordered.forEach((reqn) => {
    state.sort((a, b) => {
      const aGap = a.targetRvu - a.assignedRvu;
      const bGap = b.targetRvu - b.assignedRvu;
      if (bGap !== aGap) return bGap - aGap;
      return a.assignedRvu - b.assignedRvu;
    });
    const slot = state[0];
    if (!slot) return;
    slot.assignedRvu += reqn.rvuValue || 1;
    slot.requisitionIds.push(reqn.id);
  });

  return state;
}

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
  if (!body.patientIdOrTempLabel || !body.patientName || !body.patientDateOfBirth || !body.modality) {
    return {
      error: 'Missing required fields: patientIdOrTempLabel, patientName, patientDateOfBirth, modality',
    } as const;
  }

  const params = {
    patientIdOrTempLabel: body.patientIdOrTempLabel,
    ...(body.patientName !== undefined && body.patientName !== '' && { patientName: body.patientName }),
    ...(body.patientDateOfBirth !== undefined &&
      body.patientDateOfBirth !== '' && { patientDateOfBirth: body.patientDateOfBirth }),
    isNewExternalPatient: !!body.isNewExternalPatient,
    ...(body.orderingDoctorName !== undefined &&
      body.orderingDoctorName !== '' && { orderingDoctorName: body.orderingDoctorName }),
    ...(body.orderingClinic !== undefined && body.orderingClinic !== '' && { orderingClinic: body.orderingClinic }),
    ...(body.site !== undefined && body.site !== '' && { site: body.site }),
    ...(body.categoryId !== undefined && body.categoryId !== null && { categoryId: body.categoryId }),
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

// Bulk requisition creation for admin/clerical uploads
router.post('/bulk', requireAuth, requireRole(['admin', 'clerical']), async (req, res) => {
  const body = req.body as {
    requisitions?: Array<{
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
    }>;
  };

  const entries = Array.isArray(body.requisitions) ? body.requisitions : [];
  if (!entries.length) {
    return res.status(400).json({ error: 'requisitions array is required' });
  }
  if (entries.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 requisitions per upload' });
  }

  const created: Array<{ index: number; id: number; visitNumber: string }> = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const validated = validateAndBuildParams(entry || {});
    if ('error' in validated) {
      errors.push({ index: i + 1, error: validated.error });
      continue;
    }

    try {
      const result = await createRequisition(validated.params);
      created.push({ index: i + 1, id: result.id, visitNumber: result.visitNumber });
    } catch (err) {
      console.error(err);
      errors.push({ index: i + 1, error: 'Failed to create requisition' });
    }
  }

  return res.status(created.length ? 201 : 400).json({
    total: entries.length,
    createdCount: created.length,
    failedCount: errors.length,
    created,
    errors,
  });
});

router.get('/assigning/summary', requireAuth, requireRole(['admin']), async (req, res) => {
  const { date, shift } = req.query as { date?: string; shift?: AssigningShift };
  if (!date || !shift || !['AM', 'PM', 'NIGHT', 'NA'].includes(shift)) {
    return res.status(400).json({ error: 'date (YYYY-MM-DD) and shift (AM|PM|NIGHT|NA) are required' });
  }
  try {
    const requisitions = await loadShiftApprovedRequisitions({ date, shift });
    const rows = requisitions.map((r) => {
      const rvuValue = r.imagingItems?.[0]?.rvuValue ?? 1;
      const hasCompleted = Boolean(r.reportingAssignments?.some((a) => a.status === 'completed'));
      const alreadyAssigned = Boolean(r.reportingAssignments?.some((a) => a.status === 'assigned'));
      return {
        id: r.id,
        visitNumber: r.visit?.visitNumber ?? null,
        patientIdOrTempLabel: r.patientIdOrTempLabel,
        rvuValue,
        alreadyAssigned,
        hasCompleted,
      };
    });
    const approvedForShiftCount = rows.length;
    const eligibleRows = rows.filter((r) => !r.hasCompleted);
    const eligibleCount = eligibleRows.length;
    const alreadyAssignedCount = rows.filter((r) => r.alreadyAssigned).length;
    const completedCount = rows.filter((r) => r.hasCompleted).length;
    const totalRvu = eligibleRows.reduce((sum, r) => sum + r.rvuValue, 0);
    return res.json({
      date,
      shift,
      approvedForShiftCount,
      eligibleCount,
      alreadyAssignedCount,
      completedCount,
      totalRvu,
      rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load assigning summary' });
  }
});

router.post('/assigning/distribute', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = req.body as {
    date?: string;
    shift?: AssigningShift;
    participants?: Array<{ radiologistId?: number; weight?: number }>;
  };
  if (!body.date || !body.shift || !['AM', 'PM', 'NIGHT', 'NA'].includes(body.shift)) {
    return res.status(400).json({ error: 'date and shift are required' });
  }
  const participants = Array.isArray(body.participants) ? body.participants : [];
  const normalizedParticipants = participants
    .map((p) => ({ radiologistId: Number(p.radiologistId), weight: Number(p.weight ?? 1) }))
    .filter((p) => Number.isInteger(p.radiologistId) && Number.isFinite(p.weight) && p.weight > 0);
  if (!normalizedParticipants.length) {
    return res.status(400).json({ error: 'At least one participant with weight > 0 is required' });
  }

  try {
    const requisitions = await loadShiftApprovedRequisitions({ date: body.date, shift: body.shift });
    const eligible = requisitions
      .filter((r) => !r.reportingAssignments?.some((a) => a.status === 'completed'))
      .map((r) => ({
        id: r.id,
        rvuValue: r.imagingItems?.[0]?.rvuValue ?? 1,
      }));

    const eligibleIds = eligible.map((r) => r.id);
    if (eligibleIds.length) {
      // Redistribution: clear previous "assigned" workload for this scope, then recalculate.
      await ReportingAssignment.destroy({
        where: {
          requisitionId: { [Op.in]: eligibleIds },
          status: 'assigned',
        },
      });
    }

    const distribution = weightedDistribute(eligible, normalizedParticipants);
    const participantIds = Array.from(new Set(distribution.map((d) => d.radiologistId)));
    const users = await User.findAll({
      where: { id: { [Op.in]: participantIds } },
      attributes: ['id', 'name'],
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const shifts = await ShiftAssignment.findAll({
      where: {
        date: body.date,
        ...(body.shift === 'NA' ? {} : { shiftType: body.shift }),
        radiologistId: { [Op.in]: participantIds },
      },
      attributes: ['id', 'radiologistId', 'shiftType'],
    });
    const shiftIdByRadiologist = buildParticipantShiftMap(shifts);

    const toCreate: Array<{
      requisitionId: number;
      reportingRadiologistId: number;
      shiftId: number | null;
      status: 'assigned';
      assignedAt: Date;
    }> = [];
    distribution.forEach((slot) => {
      slot.requisitionIds.forEach((requisitionId) => {
        toCreate.push({
          requisitionId,
          reportingRadiologistId: slot.radiologistId,
          shiftId: shiftIdByRadiologist.get(slot.radiologistId) ?? null,
          status: 'assigned',
          assignedAt: new Date(),
        });
      });
    });

    if (toCreate.length) {
      await ReportingAssignment.bulkCreate(toCreate);
    }

    return res.json({
      date: body.date,
      shift: body.shift,
      assignedCount: toCreate.length,
      totalRvu: eligible.reduce((sum, r) => sum + r.rvuValue, 0),
      participants: distribution.map((d) => ({
        radiologistId: d.radiologistId,
        radiologistName: userMap.get(d.radiologistId) || `User ${d.radiologistId}`,
        weight: d.weight,
        targetRvu: Number(d.targetRvu.toFixed(2)),
        assignedRvu: d.assignedRvu,
        assignedRequisitionCount: d.requisitionIds.length,
        requisitionIds: d.requisitionIds,
      })),
      unassignedCount: 0,
      redistributed: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to distribute requisitions' });
  }
});

interface RadiologistWorklistRow {
  assignmentId: number;
  requisitionId: number;
  mrn: string;
  name: string;
  dob: string;
  modality: string;
  category: string;
  subCategories: string;
  additionalNotes: string;
  isCompleted: boolean;
  hasUrgentFindings: boolean;
}

type ReportingAssignmentWithDetails = ReportingAssignment & {
  shift?: { date?: Date | string | null; shiftType?: ShiftType | null } | null;
  requisition?: {
    id: number;
    patientIdOrTempLabel: string;
    patientName?: string | null;
    patientDateOfBirth?: Date | string | null;
    calculatedDueDate?: Date | string | null;
    visit?: { visitNumber?: string | null; scheduledDateTime?: Date | string | null } | null;
    imagingItems?: Array<{
      modality?: string | null;
      specialNotes?: string | null;
      rvuValue?: number | null;
      category?: { name?: string | null } | null;
    }>;
  } | null;
};

async function loadDistributionState(date: string, shift: AssigningShift) {
  const rawAssignments = await ReportingAssignment.findAll({
    where: {
      status: { [Op.in]: ['assigned', 'completed'] },
    },
    include: [
      {
        model: ShiftAssignment,
        as: 'shift',
        required: false,
        attributes: ['id', 'date', 'shiftType'],
      },
      {
        model: User,
        as: 'reportingRadiologist',
        required: false,
        attributes: ['id', 'name'],
      },
      {
        model: Requisition,
        as: 'requisition',
        attributes: ['id', 'calculatedDueDate'],
        include: [
          {
            model: Visit,
            as: 'visit',
            attributes: ['scheduledDateTime'],
          },
          {
            model: RequisitionImagingItem,
            as: 'imagingItems',
            attributes: ['rvuValue'],
          },
        ],
      },
    ],
    order: [['assignedAt', 'ASC']],
  });

  const assignments = rawAssignments as Array<
    ReportingAssignmentWithDetails & {
      reportingRadiologist?: { id?: number; name?: string } | null;
    }
  >;
  const filtered = filterAssignmentsForDateShift(assignments, date, shift);

  const grouped = new Map<
    number,
    {
      radiologistId: number;
      radiologistName: string;
      weight: number;
      assignedRvu: number;
      requisitionIds: number[];
    }
  >();

  filtered.forEach((a) => {
    const radiologistId = a.reportingRadiologistId;
    const radiologistName = a.reportingRadiologist?.name || `User ${radiologistId}`;
    const requisitionId = a.requisition?.id;
    if (!requisitionId) return;
    const rvuValue = a.requisition?.imagingItems?.[0]?.rvuValue ?? 1;
    if (!grouped.has(radiologistId)) {
      grouped.set(radiologistId, {
        radiologistId,
        radiologistName,
        weight: 1,
        assignedRvu: 0,
        requisitionIds: [],
      });
    }
    const entry = grouped.get(radiologistId)!;
    if (!entry.requisitionIds.includes(requisitionId)) {
      entry.requisitionIds.push(requisitionId);
      entry.assignedRvu += rvuValue;
    }
  });

  const participants = Array.from(grouped.values())
    .sort((a, b) => a.radiologistName.localeCompare(b.radiologistName))
    .map((p) => ({
      radiologistId: p.radiologistId,
      radiologistName: p.radiologistName,
      weight: p.weight,
      targetRvu: p.assignedRvu,
      assignedRvu: p.assignedRvu,
      assignedRequisitionCount: p.requisitionIds.length,
      requisitionIds: p.requisitionIds,
    }));

  return {
    date,
    shift,
    assignedCount: participants.reduce((sum, p) => sum + p.assignedRequisitionCount, 0),
    totalRvu: participants.reduce((sum, p) => sum + p.assignedRvu, 0),
    participants,
    unassignedCount: 0,
    redistributed: false,
  };
}

async function loadRadiologistWorklistRows(userId: number, date: string, shift: AssigningShift) {
  const rawAssignments = await ReportingAssignment.findAll({
    where: {
      reportingRadiologistId: userId,
      status: { [Op.in]: ['assigned', 'completed'] },
    },
    include: [
      {
        model: ShiftAssignment,
        as: 'shift',
        required: false,
        attributes: ['id', 'date', 'shiftType'],
      },
      {
        model: Requisition,
        as: 'requisition',
        attributes: ['id', 'patientIdOrTempLabel', 'patientName', 'patientDateOfBirth', 'calculatedDueDate'],
        include: [
          {
            model: Visit,
            as: 'visit',
            attributes: ['visitNumber', 'scheduledDateTime'],
          },
          {
            model: RequisitionImagingItem,
            as: 'imagingItems',
            attributes: ['modality', 'specialNotes'],
            include: [{ model: ImagingCategory, as: 'category', attributes: ['name'] }],
          },
        ],
      },
    ],
    order: [['assignedAt', 'ASC']],
  });

  const assignments = rawAssignments as ReportingAssignmentWithDetails[];
  const filtered = filterAssignmentsForDateShift(assignments, date, shift);

  const rowsByRequisitionId = new Map<number, RadiologistWorklistRow>();
  filtered.forEach((assignment) => {
    const reqn = assignment.requisition;
    if (!reqn) return;
    const item = reqn.imagingItems?.[0];
    const parsedSubCategories = parseSubCategoriesFromNotes(item?.specialNotes);
    rowsByRequisitionId.set(reqn.id, {
      assignmentId: assignment.id,
      requisitionId: reqn.id,
      mrn: reqn.patientIdOrTempLabel || '—',
      name: reqn.patientName?.trim() || '—',
      dob: formatDob(reqn.patientDateOfBirth),
      modality: item?.modality || '—',
      category: item?.category?.name || '—',
      subCategories: parsedSubCategories.join(', ') || '—',
      additionalNotes: stripManagedPrefixes(item?.specialNotes) || '—',
      isCompleted: assignment.status === 'completed',
      hasUrgentFindings: Boolean(assignment.urgentFindings),
    });
  });

  return Array.from(rowsByRequisitionId.values()).sort((a, b) => a.requisitionId - b.requisitionId);
}

router.patch('/assigning/reporting-status/:assignmentId', requireAuth, requireRole(['admin', 'radiologist']), async (req, res) => {
  const assignmentId = Number(req.params.assignmentId);
  const { completed } = req.body as { completed?: boolean };
  if (!Number.isInteger(assignmentId) || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'assignmentId and completed(boolean) are required' });
  }
  try {
    const assignment = await ReportingAssignment.findByPk(assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    assignment.status = completed ? 'completed' : 'assigned';
    assignment.completedAt = completed ? new Date() : null;
    await assignment.save();
    return res.json({
      assignmentId: assignment.id,
      status: assignment.status,
      completedAt: assignment.completedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update reporting status' });
  }
});

router.patch('/assigning/urgent-findings/:assignmentId', requireAuth, requireRole(['admin', 'radiologist']), async (req, res) => {
  const assignmentId = Number(req.params.assignmentId);
  const { urgentFindings } = req.body as { urgentFindings?: boolean };
  if (!Number.isInteger(assignmentId) || typeof urgentFindings !== 'boolean') {
    return res.status(400).json({ error: 'assignmentId and urgentFindings(boolean) are required' });
  }
  try {
    const assignment = await ReportingAssignment.findByPk(assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    assignment.urgentFindings = urgentFindings;
    await assignment.save();
    return res.json({
      assignmentId: assignment.id,
      urgentFindings: assignment.urgentFindings,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update urgent findings status' });
  }
});

router.get('/assigning/distribution-state', requireAuth, requireRole(['admin']), async (req, res) => {
  const { date, shift } = req.query as { date?: string; shift?: AssigningShift };
  if (!date || !shift || !['AM', 'PM', 'NIGHT', 'NA'].includes(shift)) {
    return res.status(400).json({ error: 'date and shift (AM|PM|NIGHT|NA) are required' });
  }
  try {
    const state = await loadDistributionState(date, shift);
    return res.json(state);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load distribution state' });
  }
});

router.get('/assigning/radiologist-worklist', requireAuth, requireRole(['admin']), async (req, res) => {
  const { date, shift, radiologistId } = req.query as {
    date?: string;
    shift?: AssigningShift;
    radiologistId?: string;
  };
  if (!date || !shift || !['AM', 'PM', 'NIGHT', 'NA'].includes(shift)) {
    return res.status(400).json({ error: 'date and shift (AM|PM|NIGHT|NA) are required' });
  }
  const userId = Number(radiologistId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'radiologistId is required' });
  }
  try {
    const user = await User.findByPk(userId, { attributes: ['id', 'name'] });
    if (!user) return res.status(404).json({ error: 'Radiologist not found' });
    const rows = await loadRadiologistWorklistRows(userId, date, shift);
    return res.json({
      radiologistId: user.id,
      radiologistName: user.name,
      date,
      shift,
      count: rows.length,
      rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load radiologist worklist' });
  }
});

router.get('/assigning/radiologist-pdf', requireAuth, requireRole(['admin']), async (req, res) => {
  const { date, shift, radiologistId } = req.query as {
    date?: string;
    shift?: AssigningShift;
    radiologistId?: string;
  };
  if (!date || !shift || !['AM', 'PM', 'NIGHT', 'NA'].includes(shift)) {
    return res.status(400).json({ error: 'date and shift (AM|PM|NIGHT|NA) are required' });
  }
  const userId = Number(radiologistId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'radiologistId is required' });
  }
  try {
    const user = await User.findByPk(userId, { attributes: ['id', 'name'] });
    if (!user) return res.status(404).json({ error: 'Radiologist not found' });
    const rows = await loadRadiologistWorklistRows(userId, date, shift);

    const safeDate = date.replace(/[^0-9-]/g, '');
    const safeShift = shift.toLowerCase();
    const safeName = user.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="requisition-worklist-${safeName}-${safeDate}-${safeShift}.pdf"`
    );

    const doc = new PDFDocument({ margin: 24, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(14).text('Radiologist Requisition Worklist', { align: 'left' });
    doc.moveDown(0.25);
    doc
      .fontSize(10)
      .fillColor('#334155')
      .text(`Radiologist: ${user.name}   |   Date: ${date}   |   Shift: ${shift === 'NA' ? 'All day' : shift}`);
    doc.moveDown(0.5);
    doc.fillColor('#111827').fontSize(9).text(`Total requisitions: ${rows.length}`);
    doc.moveDown(0.5);

    const columns = [
      { key: 'mrn', label: 'MRN', width: 85 },
      { key: 'name', label: 'Name', width: 110 },
      { key: 'dob', label: 'DOB', width: 70 },
      { key: 'modality', label: 'Modality', width: 65 },
      { key: 'category', label: 'Category', width: 105 },
      { key: 'subCategories', label: 'Sub-categories', width: 165 },
      { key: 'additionalNotes', label: 'Additional notes', width: 160 },
    ] as const;

    const drawHeader = () => {
      const headerTop = doc.y;
      let x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(8);
      columns.forEach((c) => {
        doc.rect(x, headerTop, c.width, 20).stroke('#cbd5e1');
        doc.text(c.label, x + 3, headerTop + 6, { width: c.width - 6, align: 'left' });
        x += c.width;
      });
      doc.moveDown(1.4);
      doc.font('Helvetica').fontSize(8);
    };

    drawHeader();
    rows.forEach((row) => {
      const heights = columns.map((c) =>
        doc.heightOfString(row[c.key], { width: c.width - 6, align: 'left' }) + 8
      );
      const rowHeight = Math.max(22, ...heights);

      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 24 });
        drawHeader();
      }

      let x = doc.page.margins.left;
      const top = doc.y;
      columns.forEach((c) => {
        doc.rect(x, top, c.width, rowHeight).stroke('#e2e8f0');
        doc.text(row[c.key], x + 3, top + 4, {
          width: c.width - 6,
          align: 'left',
        });
        x += c.width;
      });
      doc.y = top + rowHeight;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate radiologist PDF' });
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
