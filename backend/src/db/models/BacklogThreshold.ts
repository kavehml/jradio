import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

interface BacklogThresholdAttributes {
  id: number;
  site: string;
  modality: string | null;
  maxPending: number;
  maxAgeMinutes: number;
}

interface BacklogThresholdCreationAttributes
  extends Optional<BacklogThresholdAttributes, 'id' | 'modality'> {}

export class BacklogThreshold
  extends Model<BacklogThresholdAttributes, BacklogThresholdCreationAttributes>
  implements BacklogThresholdAttributes
{
  public id!: number;
  public site!: string;
  public modality!: string | null;
  public maxPending!: number;
  public maxAgeMinutes!: number;
}

BacklogThreshold.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxPending: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maxAgeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'backlog_thresholds',
    timestamps: true,
  }
);
