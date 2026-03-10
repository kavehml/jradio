import { Model, Optional } from 'sequelize';
export type ShiftType = 'AM' | 'PM' | 'NIGHT';
interface ShiftAssignmentAttributes {
    id: number;
    radiologistId: number;
    date: Date;
    shiftType: ShiftType;
    site: string;
    maxRvu: number | null;
}
interface ShiftAssignmentCreationAttributes extends Optional<ShiftAssignmentAttributes, 'id' | 'maxRvu'> {
}
export declare class ShiftAssignment extends Model<ShiftAssignmentAttributes, ShiftAssignmentCreationAttributes> implements ShiftAssignmentAttributes {
    id: number;
    radiologistId: number;
    date: Date;
    shiftType: ShiftType;
    site: string;
    maxRvu: number | null;
}
export {};
//# sourceMappingURL=ShiftAssignment.d.ts.map