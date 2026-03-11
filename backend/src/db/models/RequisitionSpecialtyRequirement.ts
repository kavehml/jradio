import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { Requisition } from './Requisition';

interface RequisitionSpecialtyRequirementAttributes {
  id: number;
  requisitionId: number;
  requiredSubspecialties: string[];
}

interface RequisitionSpecialtyRequirementCreationAttributes
  extends Optional<RequisitionSpecialtyRequirementAttributes, 'id' | 'requiredSubspecialties'> {}

export class RequisitionSpecialtyRequirement
  extends Model<
    RequisitionSpecialtyRequirementAttributes,
    RequisitionSpecialtyRequirementCreationAttributes
  >
  implements RequisitionSpecialtyRequirementAttributes
{
  public id!: number;
  public requisitionId!: number;
  public requiredSubspecialties!: string[];
}

RequisitionSpecialtyRequirement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requisitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'requisitions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    requiredSubspecialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['general'],
    },
  },
  {
    sequelize,
    tableName: 'requisition_specialty_requirements',
    timestamps: true,
  }
);

Requisition.hasOne(RequisitionSpecialtyRequirement, {
  foreignKey: 'requisitionId',
  as: 'specialtyRequirement',
});
RequisitionSpecialtyRequirement.belongsTo(Requisition, {
  foreignKey: 'requisitionId',
  as: 'requisition',
});
