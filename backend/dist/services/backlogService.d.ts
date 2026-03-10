export interface BacklogSummary {
    site: string;
    modality: string | null;
    pendingCount: number;
    overThreshold: boolean;
}
export declare function computeBacklogSummary(now?: Date): Promise<BacklogSummary[]>;
export declare function returnStaleAssignmentsToPool(options: {
    maxAssignmentMinutes: number;
    now?: Date;
}): Promise<{
    reportingReturned: number;
    protocolReturned: number;
}>;
//# sourceMappingURL=backlogService.d.ts.map