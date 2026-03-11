import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

interface SpecialtyRuleAttributes {
  id: number;
  modality: string;
  categoryName: string;
  subCategory: string | null;
  requiredSubspecialties: string[];
}

interface SpecialtyRuleCreationAttributes
  extends Optional<SpecialtyRuleAttributes, 'id' | 'subCategory' | 'requiredSubspecialties'> {}

export class SpecialtyRule
  extends Model<SpecialtyRuleAttributes, SpecialtyRuleCreationAttributes>
  implements SpecialtyRuleAttributes
{
  public id!: number;
  public modality!: string;
  public categoryName!: string;
  public subCategory!: string | null;
  public requiredSubspecialties!: string[];
}

SpecialtyRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    modality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requiredSubspecialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['general'],
    },
  },
  {
    sequelize,
    tableName: 'specialty_rules',
    timestamps: true,
  }
);
