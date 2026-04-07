import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { ReportingAssignment } from './Assignments';
import { User } from './User';

interface AssignmentSwapAuditAttributes {
  id: number;
  fromAssignmentId: number;
  toAssignmentId: number;
  fromRadiologistId: number;
  toRadiologistId: number;
  reason: string;
  fromRvu: number;
  toRvu: number;
  performedByUserId: number;
}

interface AssignmentSwapAuditCreationAttributes
  extends Optional<AssignmentSwapAuditAttributes, 'id'> {}

export class AssignmentSwapAudit
  extends Model<AssignmentSwapAuditAttributes, AssignmentSwapAuditCreationAttributes>
  implements AssignmentSwapAuditAttributes
{
  public id!: number;
  public fromAssignmentId!: number;
  public toAssignmentId!: number;
  public fromRadiologistId!: number;
  public toRadiologistId!: number;
  public reason!: string;
  public fromRvu!: number;
  public toRvu!: number;
  public performedByUserId!: number;
}

AssignmentSwapAudit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fromAssignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'reporting_assignments', key: 'id' },
    },
    toAssignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'reporting_assignments', key: 'id' },
    },
    fromRadiologistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    toRadiologistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fromRvu: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    toRvu: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    performedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'assignment_swap_audits',
    timestamps: true,
  }
);

ReportingAssignment.hasMany(AssignmentSwapAudit, {
  foreignKey: 'fromAssignmentId',
  as: 'swapAuditsFrom',
});
ReportingAssignment.hasMany(AssignmentSwapAudit, {
  foreignKey: 'toAssignmentId',
  as: 'swapAuditsTo',
});
AssignmentSwapAudit.belongsTo(User, { foreignKey: 'performedByUserId', as: 'performedBy' });
