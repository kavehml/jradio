import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { Requisition } from './Requisition';
import { User } from './User';
import { ShiftAssignment } from './ShiftAssignment';

export type AssignmentStatus = 'assigned' | 'completed' | 'returned_to_pool';

interface ProtocolAssignmentAttributes {
  id: number;
  requisitionId: number;
  protocolingRadiologistId: number;
  assignedAt: Date;
  completedAt: Date | null;
  status: AssignmentStatus;
}

interface ProtocolAssignmentCreationAttributes
  extends Optional<ProtocolAssignmentAttributes, 'id' | 'completedAt' | 'status'> {}

export class ProtocolAssignment
  extends Model<ProtocolAssignmentAttributes, ProtocolAssignmentCreationAttributes>
  implements ProtocolAssignmentAttributes
{
  public id!: number;
  public requisitionId!: number;
  public protocolingRadiologistId!: number;
  public assignedAt!: Date;
  public completedAt!: Date | null;
  public status!: AssignmentStatus;
}

ProtocolAssignment.init(
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
    protocolingRadiologistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('assigned', 'completed', 'returned_to_pool'),
      allowNull: false,
      defaultValue: 'assigned',
    },
  },
  {
    sequelize,
    tableName: 'protocol_assignments',
    timestamps: false,
  }
);

interface ReportingAssignmentAttributes {
  id: number;
  requisitionId: number;
  reportingRadiologistId: number;
  shiftId: number | null;
  assignedAt: Date;
  completedAt: Date | null;
  status: AssignmentStatus;
  urgentFindings: boolean;
}

interface ReportingAssignmentCreationAttributes
  extends Optional<ReportingAssignmentAttributes, 'id' | 'shiftId' | 'completedAt' | 'status' | 'urgentFindings'> {}

export class ReportingAssignment
  extends Model<ReportingAssignmentAttributes, ReportingAssignmentCreationAttributes>
  implements ReportingAssignmentAttributes
{
  public id!: number;
  public requisitionId!: number;
  public reportingRadiologistId!: number;
  public shiftId!: number | null;
  public assignedAt!: Date;
  public completedAt!: Date | null;
  public status!: AssignmentStatus;
  public urgentFindings!: boolean;
}

ReportingAssignment.init(
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
    reportingRadiologistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'shift_assignments',
        key: 'id',
      },
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('assigned', 'completed', 'returned_to_pool'),
      allowNull: false,
      defaultValue: 'assigned',
    },
    urgentFindings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'reporting_assignments',
    timestamps: false,
  }
);

Requisition.hasMany(ProtocolAssignment, { foreignKey: 'requisitionId', as: 'protocolAssignments' });
ProtocolAssignment.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });

Requisition.hasMany(ReportingAssignment, { foreignKey: 'requisitionId', as: 'reportingAssignments' });
ReportingAssignment.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });

User.hasMany(ProtocolAssignment, {
  foreignKey: 'protocolingRadiologistId',
  as: 'protocolAssignments',
});
ProtocolAssignment.belongsTo(User, {
  foreignKey: 'protocolingRadiologistId',
  as: 'protocolingRadiologist',
});

User.hasMany(ReportingAssignment, {
  foreignKey: 'reportingRadiologistId',
  as: 'reportingAssignments',
});
ReportingAssignment.belongsTo(User, {
  foreignKey: 'reportingRadiologistId',
  as: 'reportingRadiologist',
});

ShiftAssignment.hasMany(ReportingAssignment, { foreignKey: 'shiftId', as: 'assignments' });
ReportingAssignment.belongsTo(ShiftAssignment, { foreignKey: 'shiftId', as: 'shift' });
