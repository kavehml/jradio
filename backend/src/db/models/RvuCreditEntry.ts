import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { User } from './User';

export type RvuCreditType = 'earned' | 'given';

interface RvuCreditEntryAttributes {
  id: number;
  radiologistId: number;
  creditType: RvuCreditType;
  amount: number;
  applyDate: string;
  note: string | null;
  createdByUserId: number;
}

interface RvuCreditEntryCreationAttributes
  extends Optional<RvuCreditEntryAttributes, 'id' | 'note'> {}

export class RvuCreditEntry
  extends Model<RvuCreditEntryAttributes, RvuCreditEntryCreationAttributes>
  implements RvuCreditEntryAttributes
{
  public id!: number;
  public radiologistId!: number;
  public creditType!: RvuCreditType;
  public amount!: number;
  public applyDate!: string;
  public note!: string | null;
  public createdByUserId!: number;
}

RvuCreditEntry.init(
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
    creditType: {
      type: DataTypes.ENUM('earned', 'given'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    applyDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'rvu_credit_entries',
    timestamps: true,
  }
);

User.hasMany(RvuCreditEntry, { foreignKey: 'radiologistId', as: 'rvuCredits' });
RvuCreditEntry.belongsTo(User, { foreignKey: 'radiologistId', as: 'radiologist' });

User.hasMany(RvuCreditEntry, { foreignKey: 'createdByUserId', as: 'createdRvuCredits' });
RvuCreditEntry.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
