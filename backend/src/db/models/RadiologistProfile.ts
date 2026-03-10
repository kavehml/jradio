import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';
import { User } from './User';

export type Subspecialty =
  | 'neck'
  | 'angio'
  | 'interventional'
  | 'virtual_colonoscopy'
  | 'coronary'
  | 'general_body';

interface RadiologistProfileAttributes {
  id: number;
  userId: number;
  subspecialties: Subspecialty[];
  maxRvuPerShift: number | null;
  sites: string[];
}

interface RadiologistProfileCreationAttributes
  extends Optional<RadiologistProfileAttributes, 'id' | 'maxRvuPerShift' | 'sites'> {}

export class RadiologistProfile
  extends Model<RadiologistProfileAttributes, RadiologistProfileCreationAttributes>
  implements RadiologistProfileAttributes
{
  public id!: number;
  public userId!: number;
  public subspecialties!: Subspecialty[];
  public maxRvuPerShift!: number | null;
  public sites!: string[];
}

RadiologistProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    subspecialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    maxRvuPerShift: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sites: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'radiologist_profiles',
    timestamps: true,
  }
);

User.hasOne(RadiologistProfile, { foreignKey: 'userId', as: 'radiologistProfile' });
RadiologistProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
