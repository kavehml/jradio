import { Requisition } from '../db/models/Requisition';
import { RequisitionImagingItem } from '../db/models/RequisitionImagingItem';
import { Visit } from '../db/models/Visit';
import { SpecialtyRule } from '../db/models/SpecialtyRule';
import { RequisitionSpecialtyRequirement } from '../db/models/RequisitionSpecialtyRequirement';
import { ImagingCategory } from '../db/models/ImagingCategory';
import { Op } from 'sequelize';

// Due date: if timeDelayPreset set, use it; else no imaging in 24h -> 3 months, has imaging in 24h -> 30 days.
const DEFAULT_CONTROL_DAYS = 90;
const DEFAULT_PRIMARY_DAYS = 30;

function parseTimeDelayPreset(preset: string | undefined): number | null {
  if (!preset) return null;
  const lower = preset.toLowerCase();
  if (lower === '24h') return 24;
  if (lower === '7d') return 7 * 24;
  if (lower === '30d') return 30 * 24;
  if (lower === '3m') return 90 * 24;
  return null;
}

function computeRvu(bodyParts: string[], modality: string): number {
  if (modality.toLowerCase() === 'angio') {
    return 3;
  }
  const parts = bodyParts.length;
  if (parts <= 0) return 1;
  if (parts === 1) return 1;
  return 2;
}

export async function createRequisition(params: {
  patientIdOrTempLabel: string;
  isNewExternalPatient: boolean;
  orderingDoctorName: string;
  orderingClinic: string;
  site: string;
  dateOfRequest?: string;
  timeDelayPreset?: string;
  hasImagingWithin24h?: boolean;
  categoryId: number;
  modality: string;
  bodyParts: string[];
  withContrast?: boolean;
  notes?: string;
  selectedSubCategories?: string[];
}) {
  const now = new Date();
  let calculatedDueDate: Date | null = null;
  const hours = parseTimeDelayPreset(params.timeDelayPreset);
  if (hours != null) {
    calculatedDueDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
  } else {
    const days = params.hasImagingWithin24h ? DEFAULT_PRIMARY_DAYS : DEFAULT_CONTROL_DAYS;
    calculatedDueDate = new Date(now);
    calculatedDueDate.setDate(calculatedDueDate.getDate() + days);
  }

  const requestedDate = params.dateOfRequest ? new Date(params.dateOfRequest) : null;
  const urgencyWindowHours = hours;

  const requisition = await Requisition.create({
    requestedDate,
    urgencyWindowHours,
    calculatedDueDate,
    patientIdOrTempLabel: params.patientIdOrTempLabel,
    isNewExternalPatient: params.isNewExternalPatient,
    orderingDoctorName: params.orderingDoctorName,
    orderingClinic: params.orderingClinic,
    site: params.site,
    status: 'pending_approval',
  });

  const rvuValue = computeRvu(params.bodyParts, params.modality);
  await RequisitionImagingItem.create({
    requisitionId: requisition.id,
    modality: params.modality,
    bodyParts: params.bodyParts,
    withContrast: params.withContrast ?? false,
    specialNotes: params.notes ?? null,
    rvuValue,
    categoryId: params.categoryId,
  });

  const visitNumber = `V-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${requisition.id}`;
  await Visit.create({
    requisitionId: requisition.id,
    visitNumber,
    scheduledDateTime: null,
    location: params.site,
  });

  const category = await ImagingCategory.findByPk(params.categoryId, {
    attributes: ['name'],
  });
  const categoryName = category?.name || '';
  const selectedSubCategories = (params.selectedSubCategories || []).filter(Boolean);
  let requiredSubspecialties: string[] = [];

  if (selectedSubCategories.length) {
    const subRules = await SpecialtyRule.findAll({
      where: {
        modality: params.modality,
        categoryName,
        subCategory: { [Op.in]: selectedSubCategories },
      },
    });
    requiredSubspecialties = Array.from(
      new Set(subRules.flatMap((r) => r.requiredSubspecialties || []))
    );
  }

  if (!requiredSubspecialties.length) {
    const categoryRule = await SpecialtyRule.findOne({
      where: {
        modality: params.modality,
        categoryName,
        subCategory: null,
      },
    });
    requiredSubspecialties = categoryRule?.requiredSubspecialties || [];
  }
  if (!requiredSubspecialties.length) requiredSubspecialties = ['general'];

  await RequisitionSpecialtyRequirement.create({
    requisitionId: requisition.id,
    requiredSubspecialties,
  });

  return {
    id: requisition.id,
    visitNumber,
    calculatedDueDate: calculatedDueDate.toISOString(),
    status: requisition.status,
    requiredSubspecialties,
  };
}
