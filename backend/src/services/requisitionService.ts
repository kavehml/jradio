import { Requisition } from '../db/models/Requisition';
import { RequisitionImagingItem } from '../db/models/RequisitionImagingItem';
import { Visit } from '../db/models/Visit';
import { SpecialtyRule } from '../db/models/SpecialtyRule';
import { RequisitionSpecialtyRequirement } from '../db/models/RequisitionSpecialtyRequirement';
import { ImagingCategory } from '../db/models/ImagingCategory';
import { TimeDelayOption } from '../db/models/TimeDelayOption';
import { Op } from 'sequelize';
import { sequelize } from '../db/index';

// Due date: if timeDelayPreset set, use it; else no imaging in 24h -> 3 months, has imaging in 24h -> 30 days.
const DEFAULT_CONTROL_DAYS = 90;
const DEFAULT_PRIMARY_DAYS = 30;

async function parseTimeDelayPreset(preset: string | undefined): Promise<number | null> {
  if (!preset) return null;
  const configured = await TimeDelayOption.findOne({
    where: { code: preset, active: true },
    attributes: ['hours'],
  });
  if (configured) return configured.hours;
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

export async function resolveRequiredSubspecialties(params: {
  modality: string;
  categoryId?: number | null;
  selectedSubCategories?: string[];
}) {
  if (!params.categoryId) return ['general'];
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
  if (!requiredSubspecialties.length) requiredSubspecialties = ['general'];
  return requiredSubspecialties;
}

export async function createRequisition(params: {
  patientIdOrTempLabel: string;
  patientName?: string;
  patientDateOfBirth?: string;
  isNewExternalPatient: boolean;
  orderingDoctorName?: string;
  orderingClinic?: string;
  site?: string;
  dateOfRequest?: string;
  timeDelayPreset?: string;
  hasImagingWithin24h?: boolean;
  categoryId?: number | null;
  modality: string;
  bodyParts?: string[];
  withContrast?: boolean;
  notes?: string;
  selectedSubCategories?: string[];
}) {
  return sequelize.transaction(async (tx) => {
    const now = new Date();
    let calculatedDueDate: Date | null = null;
    const hours = await parseTimeDelayPreset(params.timeDelayPreset);
    if (hours != null) {
      calculatedDueDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else {
      const days = params.hasImagingWithin24h ? DEFAULT_PRIMARY_DAYS : DEFAULT_CONTROL_DAYS;
      calculatedDueDate = new Date(now);
      calculatedDueDate.setDate(calculatedDueDate.getDate() + days);
    }

    const requestedDate = params.dateOfRequest ? new Date(params.dateOfRequest) : null;
    const urgencyWindowHours = hours;

    const requisition = await Requisition.create(
      {
        requestedDate,
        urgencyWindowHours,
        calculatedDueDate,
        patientIdOrTempLabel: params.patientIdOrTempLabel,
        patientName: params.patientName?.trim() || null,
        patientDateOfBirth: params.patientDateOfBirth ? new Date(params.patientDateOfBirth) : null,
        isNewExternalPatient: params.isNewExternalPatient,
        orderingDoctorName: params.orderingDoctorName?.trim() || 'Unknown',
        orderingClinic: params.orderingClinic?.trim() || 'Unknown',
        site: params.site?.trim() || 'Unknown',
        status: 'pending_approval',
      },
      { transaction: tx }
    );

    const bodyParts = Array.isArray(params.bodyParts) && params.bodyParts.length ? params.bodyParts : [params.modality];
    const rvuValue = computeRvu(bodyParts, params.modality);
    await RequisitionImagingItem.create(
      {
        requisitionId: requisition.id,
        modality: params.modality,
        bodyParts,
        withContrast: params.withContrast ?? false,
        specialNotes: params.notes ?? null,
        rvuValue,
        categoryId: params.categoryId ?? null,
      },
      { transaction: tx }
    );

    const visitNumber = `V-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${requisition.id}`;
    await Visit.create(
      {
        requisitionId: requisition.id,
        visitNumber,
        scheduledDateTime: null,
        location: params.site?.trim() || 'Unknown',
      },
      { transaction: tx }
    );

    const requiredSubspecialties = await resolveRequiredSubspecialties({
      modality: params.modality,
      ...(params.categoryId !== undefined && { categoryId: params.categoryId }),
      ...(params.selectedSubCategories !== undefined && {
        selectedSubCategories: params.selectedSubCategories,
      }),
    });

    await RequisitionSpecialtyRequirement.create(
      {
        requisitionId: requisition.id,
        requiredSubspecialties,
      },
      { transaction: tx }
    );

    return {
      id: requisition.id,
      visitNumber,
      calculatedDueDate: calculatedDueDate.toISOString(),
      status: requisition.status,
      requiredSubspecialties,
    };
  });
}
