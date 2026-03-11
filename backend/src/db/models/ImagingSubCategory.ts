import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { ImagingCategory } from './ImagingCategory';

interface ImagingSubCategoryAttributes {
  id: number;
  categoryId: number;
  name: string;
}

interface ImagingSubCategoryCreationAttributes extends Optional<ImagingSubCategoryAttributes, 'id'> {}

export class ImagingSubCategory
  extends Model<ImagingSubCategoryAttributes, ImagingSubCategoryCreationAttributes>
  implements ImagingSubCategoryAttributes
{
  public id!: number;
  public categoryId!: number;
  public name!: string;
}

ImagingSubCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'imaging_categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'imaging_subcategories',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['categoryId', 'name'],
      },
    ],
  }
);

ImagingCategory.hasMany(ImagingSubCategory, { foreignKey: 'categoryId', as: 'subCategories' });
ImagingSubCategory.belongsTo(ImagingCategory, { foreignKey: 'categoryId', as: 'category' });
