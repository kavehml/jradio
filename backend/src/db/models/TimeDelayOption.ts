import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

interface TimeDelayOptionAttributes {
  id: number;
  code: string;
  label: string;
  hours: number;
  active: boolean;
}

interface TimeDelayOptionCreationAttributes
  extends Optional<TimeDelayOptionAttributes, 'id' | 'active'> {}

export class TimeDelayOption
  extends Model<TimeDelayOptionAttributes, TimeDelayOptionCreationAttributes>
  implements TimeDelayOptionAttributes
{
  public id!: number;
  public code!: string;
  public label!: string;
  public hours!: number;
  public active!: boolean;
}

TimeDelayOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'time_delay_options',
    timestamps: true,
  }
);
