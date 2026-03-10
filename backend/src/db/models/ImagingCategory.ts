import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

export type Modality = 'CT' | 'MRI' | 'Angio' | 'US' | 'Other';

interface ImagingCategoryAttributes {
  id: number;
  name: string;
  modality: Modality;
  bodyPart: string;
  isSubspecialtyRestricted: boolean;
  imagePath: string | null;
}

interface ImagingCategoryCreationAttributes
  extends Optional<ImagingCategoryAttributes, 'id' | 'imagePath'> {}

export class ImagingCategory
  extends Model<ImagingCategoryAttributes, ImagingCategoryCreationAttributes>
  implements ImagingCategoryAttributes
{
  public id!: number;
  public name!: string;
  public modality!: Modality;
  public bodyPart!: string;
  public isSubspecialtyRestricted!: boolean;
  public imagePath!: string | null;
}

ImagingCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modality: {
      type: DataTypes.ENUM('CT', 'MRI', 'Angio', 'US', 'Other'),
      allowNull: false,
    },
    bodyPart: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isSubspecialtyRestricted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    imagePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'imaging_categories',
    timestamps: true,
  }
);
