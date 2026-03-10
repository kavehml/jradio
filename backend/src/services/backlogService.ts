import { Op } from 'sequelize';
import { ReportingAssignment, ProtocolAssignment } from '../db/models/Assignments';
import { BacklogThreshold } from '../db/models/BacklogThreshold';
import { Requisition } from '../db/models/Requisition';

export interface BacklogSummary {
  site: string;
  modality: string | null;
  pendingCount: number;
  overThreshold: boolean;
}

export async function computeBacklogSummary(now: Date = new Date()): Promise<BacklogSummary[]> {
  const thresholds = await BacklogThreshold.findAll();
  const summaries: BacklogSummary[] = [];

  for (const threshold of thresholds) {
    const pending = await ReportingAssignment.count({
      where: {
        status: 'assigned',
        assignedAt: {
          [Op.lte]: new Date(now.getTime() - threshold.maxAgeMinutes * 60 * 1000),
        },
      },
      include: [
        {
          model: Requisition,
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

export async function returnStaleAssignmentsToPool(options: {
  maxAssignmentMinutes: number;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - options.maxAssignmentMinutes * 60 * 1000);

  const reportingUpdated = await ReportingAssignment.update(
    { status: 'returned_to_pool' },
    {
      where: {
        status: 'assigned',
        assignedAt: { [Op.lte]: cutoff },
      },
    }
  );

  const protocolUpdated = await ProtocolAssignment.update(
    { status: 'returned_to_pool' },
    {
      where: {
        status: 'assigned',
        assignedAt: { [Op.lte]: cutoff },
      },
    }
  );

  return {
    reportingReturned: reportingUpdated[0],
    protocolReturned: protocolUpdated[0],
  };
}
