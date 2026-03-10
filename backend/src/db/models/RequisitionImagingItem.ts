import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { Requisition } from './Requisition';
import { ImagingCategory } from './ImagingCategory';

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

interface RequisitionImagingItemCreationAttributes
  extends Optional<RequisitionImagingItemAttributes, 'id' | 'specialNotes' | 'categoryId'> {}

export class RequisitionImagingItem
  extends Model<RequisitionImagingItemAttributes, RequisitionImagingItemCreationAttributes>
  implements RequisitionImagingItemAttributes
{
  public id!: number;
  public requisitionId!: number;
  public modality!: string;
  public bodyParts!: string[];
  public withContrast!: boolean;
  public specialNotes!: string | null;
  public rvuValue!: number;
  public categoryId!: number | null;
}

RequisitionImagingItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requisitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'requisitions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    modality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bodyParts: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    withContrast: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    specialNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rvuValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'imaging_categories',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'requisition_imaging_items',
    timestamps: true,
  }
);

Requisition.hasMany(RequisitionImagingItem, { foreignKey: 'requisitionId', as: 'imagingItems' });
RequisitionImagingItem.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });

ImagingCategory.hasMany(RequisitionImagingItem, { foreignKey: 'categoryId', as: 'requisitionItems' });
RequisitionImagingItem.belongsTo(ImagingCategory, { foreignKey: 'categoryId', as: 'category' });
