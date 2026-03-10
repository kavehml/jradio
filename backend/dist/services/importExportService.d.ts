export declare function importOutpatientCsv(csvText: string): Promise<{
    count: number;
    created: {
        requisitionId: number;
        visitNumber: string;
    }[];
}>;
export declare function exportRvuSummaryCsv(from: Date, to: Date): Promise<any>;
//# sourceMappingURL=importExportService.d.ts.map