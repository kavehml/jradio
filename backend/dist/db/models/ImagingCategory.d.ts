import { Model, Optional } from 'sequelize';
export type Modality = 'CT' | 'MRI' | 'Angio' | 'US' | 'Other';
interface ImagingCategoryAttributes {
    id: number;
    name: string;
    modality: Modality;
    bodyPart: string;
    isSubspecialtyRestricted: boolean;
    imagePath: string | null;
}
interface ImagingCategoryCreationAttributes extends Optional<ImagingCategoryAttributes, 'id' | 'imagePath'> {
}
export declare class ImagingCategory extends Model<ImagingCategoryAttributes, ImagingCategoryCreationAttributes> implements ImagingCategoryAttributes {
    id: number;
    name: string;
    modality: Modality;
    bodyPart: string;
    isSubspecialtyRestricted: boolean;
    imagePath: string | null;
}
export {};
//# sourceMappingURL=ImagingCategory.d.ts.map