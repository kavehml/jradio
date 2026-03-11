import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

interface SiteLocationAttributes {
  id: number;
  name: string;
}

interface SiteLocationCreationAttributes extends Optional<SiteLocationAttributes, 'id'> {}

export class SiteLocation
  extends Model<SiteLocationAttributes, SiteLocationCreationAttributes>
  implements SiteLocationAttributes
{
  public id!: number;
  public name!: string;
}

SiteLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'site_locations',
    timestamps: true,
  }
);

