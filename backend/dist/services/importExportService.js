"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importOutpatientCsv = importOutpatientCsv;
exports.exportRvuSummaryCsv = exportRvuSummaryCsv;
const sync_1 = require("csv-parse/sync");
const sequelize_1 = require("sequelize");
// json2csv has no official types, so we import via require.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Parser: Json2CsvParser } = require('json2csv');
const Requisition_1 = require("../db/models/Requisition");
const RequisitionImagingItem_1 = require("../db/models/RequisitionImagingItem");
const Visit_1 = require("../db/models/Visit");
const Assignments_1 = require("../db/models/Assignments");
const User_1 = require("../db/models/User");
async function importOutpatientCsv(csvText) {
    const records = (0, sync_1.parse)(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    const created = [];
    for (const row of records) {
        const requisition = await Requisition_1.Requisition.create({
            patientIdOrTempLabel: row.patientIdOrTempLabel,
            isNewExternalPatient: false,
            orderingDoctorName: row.orderingDoctorName || 'Unknown',
            orderingClinic: row.orderingClinic || 'Unknown',
            site: row.site,
            status: 'approved',
        });
        const bodyParts = row.bodyParts.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
        await RequisitionImagingItem_1.RequisitionImagingItem.create({
            requisitionId: requisition.id,
            modality: row.modality,
            bodyParts,
            withContrast: false,
            rvuValue: bodyParts.length <= 1 ? 1 : 2,
            specialNotes: null,
            categoryId: null,
        });
        const visitNumber = `V-${Date.now()}-${requisition.id}`;
        await Visit_1.Visit.create({
            requisitionId: requisition.id,
            visitNumber,
            scheduledDateTime: new Date(row.scheduledDateTime),
            location: row.site,
        });
        created.push({ requisitionId: requisition.id, visitNumber });
    }
    return { count: created.length, created };
}
async function exportRvuSummaryCsv(from, to) {
    const assignments = await Assignments_1.ReportingAssignment.findAll({
        where: {
            completedAt: {
                [sequelize_1.Op.between]: [from, to],
            },
            status: 'completed',
        },
        include: [
            { model: User_1.User, as: 'reportingRadiologist' },
            { model: Requisition_1.Requisition, as: 'requisition' },
        ],
    });
    const rows = assignments.map((a) => {
        const anyA = a;
        const radiologist = anyA.reportingRadiologist;
        const requisition = anyA.requisition;
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
//# sourceMappingURL=importExportService.js.map