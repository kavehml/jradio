import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { Requisition } from './Requisition';

interface VisitAttributes {
  id: number;
  visitNumber: string;
  requisitionId: number;
  scheduledDateTime: Date | null;
  location: string;
}

interface VisitCreationAttributes extends Optional<VisitAttributes, 'id' | 'scheduledDateTime'> {}

export class Visit extends Model<VisitAttributes, VisitCreationAttributes> implements VisitAttributes {
  public id!: number;
  public visitNumber!: string;
  public requisitionId!: number;
  public scheduledDateTime!: Date | null;
  public location!: string;
}

Visit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    visitNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    scheduledDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'visits',
    timestamps: true,
  }
);

Requisition.hasOne(Visit, { foreignKey: 'requisitionId', as: 'visit' });
Visit.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
