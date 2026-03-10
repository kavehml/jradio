import { parse } from 'csv-parse/sync';
import { Op } from 'sequelize';
// json2csv has no official types, so we import via require.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Parser: Json2CsvParser } = require('json2csv');
import { Requisition } from '../db/models/Requisition';
import { RequisitionImagingItem } from '../db/models/RequisitionImagingItem';
import { Visit } from '../db/models/Visit';
import { ReportingAssignment } from '../db/models/Assignments';
import { User } from '../db/models/User';

interface OutpatientCsvRow {
  patientIdOrTempLabel: string;
  scheduledDateTime: string;
  site: string;
  modality: string;
  bodyParts: string;
  orderingDoctorName?: string;
  orderingClinic?: string;
}

export async function importOutpatientCsv(csvText: string) {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as OutpatientCsvRow[];

  const created: { requisitionId: number; visitNumber: string }[] = [];

  for (const row of records) {
    const requisition = await Requisition.create({
      patientIdOrTempLabel: row.patientIdOrTempLabel,
      isNewExternalPatient: false,
      orderingDoctorName: row.orderingDoctorName || 'Unknown',
      orderingClinic: row.orderingClinic || 'Unknown',
      site: row.site,
      status: 'approved',
    });

    const bodyParts = row.bodyParts.split(/[,;]/).map((p) => p.trim()).filter(Boolean);

    await RequisitionImagingItem.create({
      requisitionId: requisition.id,
      modality: row.modality,
      bodyParts,
      withContrast: false,
      rvuValue: bodyParts.length <= 1 ? 1 : 2,
      specialNotes: null,
      categoryId: null,
    });

    const visitNumber = `V-${Date.now()}-${requisition.id}`;

    await Visit.create({
      requisitionId: requisition.id,
      visitNumber,
      scheduledDateTime: new Date(row.scheduledDateTime),
      location: row.site,
    });

    created.push({ requisitionId: requisition.id, visitNumber });
  }

  return { count: created.length, created };
}

export async function exportRvuSummaryCsv(from: Date, to: Date) {
  const assignments = await ReportingAssignment.findAll({
    where: {
      completedAt: {
        [Op.between]: [from, to],
      },
      status: 'completed',
    },
    include: [
      { model: User, as: 'reportingRadiologist' },
      { model: Requisition, as: 'requisition' },
    ],
  });

  const rows = assignments.map((a) => {
    const anyA = a as any;
    const radiologist = anyA.reportingRadiologist as User | undefined;
    const requisition = anyA.requisition as Requisition | undefined;
    const rvu = 1; // placeholder per-case RVU; could be sum of items

    return {
      radiologistId: radiologist?.id,
      radiologistName: radiologist?.name,
      site: requisition?.site,
      completedAt: a.completedAt,
      rvu,
    };
  });

  const parser = new Json2CsvParser({ fields: ['radiologistId', 'radiologistName', 'site', 'completedAt', 'rvu'] });
  const csv = parser.parse(rows);
  return csv;
}
