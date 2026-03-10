import { Model, Optional } from 'sequelize';
interface VisitAttributes {
    id: number;
    visitNumber: string;
    requisitionId: number;
    scheduledDateTime: Date | null;
    location: string;
}
interface VisitCreationAttributes extends Optional<VisitAttributes, 'id' | 'scheduledDateTime'> {
}
export declare class Visit extends Model<VisitAttributes, VisitCreationAttributes> implements VisitAttributes {
    id: number;
    visitNumber: string;
    requisitionId: number;
    scheduledDateTime: Date | null;
    location: string;
}
export {};
//# sourceMappingURL=Visit.d.ts.map