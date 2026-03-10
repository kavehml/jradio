import { Model, Optional } from 'sequelize';
interface BacklogThresholdAttributes {
    id: number;
    site: string;
    modality: string | null;
    maxPending: number;
    maxAgeMinutes: number;
}
interface BacklogThresholdCreationAttributes extends Optional<BacklogThresholdAttributes, 'id' | 'modality'> {
}
export declare class BacklogThreshold extends Model<BacklogThresholdAttributes, BacklogThresholdCreationAttributes> implements BacklogThresholdAttributes {
    id: number;
    site: string;
    modality: string | null;
    maxPending: number;
    maxAgeMinutes: number;
}
export {};
//# sourceMappingURL=BacklogThreshold.d.ts.map