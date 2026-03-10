"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeBacklogSummary = computeBacklogSummary;
exports.returnStaleAssignmentsToPool = returnStaleAssignmentsToPool;
const sequelize_1 = require("sequelize");
const Assignments_1 = require("../db/models/Assignments");
const BacklogThreshold_1 = require("../db/models/BacklogThreshold");
const Requisition_1 = require("../db/models/Requisition");
async function computeBacklogSummary(now = new Date()) {
    const thresholds = await BacklogThreshold_1.BacklogThreshold.findAll();
    const summaries = [];
    for (const threshold of thresholds) {
        const pending = await Assignments_1.ReportingAssignment.count({
            where: {
                status: 'assigned',
                assignedAt: {
                    [sequelize_1.Op.lte]: new Date(now.getTime() - threshold.maxAgeMinutes * 60 * 1000),
                },
            },
            include: [
                {
                    model: Requisition_1.Requisition,
                    as: 'requisition',
                    where: {
                        site: threshold.site,
                    },
                },
            ],
        });
        const overThreshold = pending > threshold.maxPending;
        summaries.push({
            site: threshold.site,
            modality: threshold.modality,
            pendingCount: pending,
            overThreshold,
        });
    }
    return summaries;
}
async function returnStaleAssignmentsToPool(options) {
    const now = options.now ?? new Date();
    const cutoff = new Date(now.getTime() - options.maxAssignmentMinutes * 60 * 1000);
    const reportingUpdated = await Assignments_1.ReportingAssignment.update({ status: 'returned_to_pool' }, {
        where: {
            status: 'assigned',
            assignedAt: { [sequelize_1.Op.lte]: cutoff },
        },
    });
    const protocolUpdated = await Assignments_1.ProtocolAssignment.update({ status: 'returned_to_pool' }, {
        where: {
            status: 'assigned',
            assignedAt: { [sequelize_1.Op.lte]: cutoff },
        },
    });
    return {
        reportingReturned: reportingUpdated[0],
        protocolReturned: protocolUpdated[0],
    };
}
//# sourceMappingURL=backlogService.js.map