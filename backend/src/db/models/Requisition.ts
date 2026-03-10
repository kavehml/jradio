import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { User } from './User';

export type RequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'reported'
  | 'returned_to_pool';

interface RequisitionAttributes {
  id: number;
  createdAt: Date;
  requestedDate: Date | null;
  urgencyWindowHours: number | null;
  calculatedDueDate: Date | null;
  patientIdOrTempLabel: string;
  isNewExternalPatient: boolean;
  orderingDoctorName: string;
  orderingClinic: string;
  site: string;
  status: RequisitionStatus;
}

interface RequisitionCreationAttributes
  extends Optional<
    RequisitionAttributes,
    'id' | 'createdAt' | 'requestedDate' | 'urgencyWindowHours' | 'calculatedDueDate' | 'status'
  > {}

export class Requisition
  extends Model<RequisitionAttributes, RequisitionCreationAttributes>
  implements RequisitionAttributes
{
  public id!: number;
  public createdAt!: Date;
  public requestedDate!: Date | null;
  public urgencyWindowHours!: number | null;
  public calculatedDueDate!: Date | null;
  public patientIdOrTempLabel!: string;
  public isNewExternalPatient!: boolean;
  public orderingDoctorName!: string;
  public orderingClinic!: string;
  public site!: string;
  public status!: RequisitionStatus;
}

Requisition.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    requestedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    urgencyWindowHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    calculatedDueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    patientIdOrTempLabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isNewExternalPatient: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    orderingDoctorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orderingClinic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'pending_approval',
        'approved',
        'scheduled',
        'reported',
        'returned_to_pool'
      ),
      allowNull: false,
      defaultValue: 'pending_approval',
    },
  },
  {
    sequelize,
    tableName: 'requisitions',
    updatedAt: true,
    createdAt: false,
  }
);
