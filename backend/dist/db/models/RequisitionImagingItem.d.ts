import { Model, Optional } from 'sequelize';
interface RequisitionImagingItemAttributes {
    id: number;
    requisitionId: number;
    modality: string;
    bodyParts: string[];
    withContrast: boolean;
    specialNotes: string | null;
    rvuValue: number;
    categoryId: number | null;
}
interface RequisitionImagingItemCreationAttributes extends Optional<RequisitionImagingItemAttributes, 'id' | 'specialNotes' | 'categoryId'> {
}
export declare class RequisitionImagingItem extends Model<RequisitionImagingItemAttributes, RequisitionImagingItemCreationAttributes> implements RequisitionImagingItemAttributes {
    id: number;
    requisitionId: number;
    modality: string;
    bodyParts: string[];
    withContrast: boolean;
    specialNotes: string | null;
    rvuValue: number;
    categoryId: number | null;
}
export {};
//# sourceMappingURL=RequisitionImagingItem.d.ts.map