import { Model, Optional } from 'sequelize';
export type AssignmentStatus = 'assigned' | 'completed' | 'returned_to_pool';
interface ProtocolAssignmentAttributes {
    id: number;
    requisitionId: number;
    protocolingRadiologistId: number;
    assignedAt: Date;
    completedAt: Date | null;
    status: AssignmentStatus;
}
interface ProtocolAssignmentCreationAttributes extends Optional<ProtocolAssignmentAttributes, 'id' | 'completedAt' | 'status'> {
}
export declare class ProtocolAssignment extends Model<ProtocolAssignmentAttributes, ProtocolAssignmentCreationAttributes> implements ProtocolAssignmentAttributes {
    id: number;
    requisitionId: number;
    protocolingRadiologistId: number;
    assignedAt: Date;
    completedAt: Date | null;
    status: AssignmentStatus;
}
interface ReportingAssignmentAttributes {
    id: number;
    requisitionId: number;
    reportingRadiologistId: number;
    shiftId: number | null;
    assignedAt: Date;
    completedAt: Date | null;
    status: AssignmentStatus;
}
interface ReportingAssignmentCreationAttributes extends Optional<ReportingAssignmentAttributes, 'id' | 'shiftId' | 'completedAt' | 'status'> {
}
export declare class ReportingAssignment extends Model<ReportingAssignmentAttributes, ReportingAssignmentCreationAttributes> implements ReportingAssignmentAttributes {
    id: number;
    requisitionId: number;
    reportingRadiologistId: number;
    shiftId: number | null;
    assignedAt: Date;
    completedAt: Date | null;
    status: AssignmentStatus;
}
export {};
//# sourceMappingURL=Assignments.d.ts.map