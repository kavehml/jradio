import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { User } from './User';

export type ShiftType = 'AM' | 'PM' | 'NIGHT';

interface ShiftAssignmentAttributes {
  id: number;
  radiologistId: number;
  date: Date;
  shiftType: ShiftType;
  site: string;
  maxRvu: number | null;
}

interface ShiftAssignmentCreationAttributes
  extends Optional<ShiftAssignmentAttributes, 'id' | 'maxRvu'> {}

export class ShiftAssignment
  extends Model<ShiftAssignmentAttributes, ShiftAssignmentCreationAttributes>
  implements ShiftAssignmentAttributes
{
  public id!: number;
  public radiologistId!: number;
  public date!: Date;
  public shiftType!: ShiftType;
  public site!: string;
  public maxRvu!: number | null;
}

ShiftAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    radiologistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    shiftType: {
      type: DataTypes.ENUM('AM', 'PM', 'NIGHT'),
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    maxRvu: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'shift_assignments',
    timestamps: true,
  }
);

User.hasMany(ShiftAssignment, { foreignKey: 'radiologistId', as: 'shifts' });
ShiftAssignment.belongsTo(User, { foreignKey: 'radiologistId', as: 'radiologist' });
