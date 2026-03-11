import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

interface ClinicAttributes {
  id: number;
  name: string;
}

interface ClinicCreationAttributes extends Optional<ClinicAttributes, 'id'> {}

export class Clinic extends Model<ClinicAttributes, ClinicCreationAttributes> implements ClinicAttributes {
  public id!: number;
  public name!: string;
}

Clinic.init(
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
    tableName: 'clinics',
    timestamps: true,
  }
);

