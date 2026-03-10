import { Model, Optional } from 'sequelize';
export type Subspecialty = 'neck' | 'angio' | 'interventional' | 'virtual_colonoscopy' | 'coronary' | 'general_body';
interface RadiologistProfileAttributes {
    id: number;
    userId: number;
    subspecialties: Subspecialty[];
    maxRvuPerShift: number | null;
    sites: string[];
}
interface RadiologistProfileCreationAttributes extends Optional<RadiologistProfileAttributes, 'id' | 'maxRvuPerShift' | 'sites'> {
}
export declare class RadiologistProfile extends Model<RadiologistProfileAttributes, RadiologistProfileCreationAttributes> implements RadiologistProfileAttributes {
    id: number;
    userId: number;
    subspecialties: Subspecialty[];
    maxRvuPerShift: number | null;
    sites: string[];
}
export {};
//# sourceMappingURL=RadiologistProfile.d.ts.map