import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

export type UserRole = 'radiologist' | 'clerical' | 'admin';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'active'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: UserRole;
  public active!: boolean;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('radiologist', 'clerical', 'admin'),
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
    tableName: 'users',
    timestamps: true,
  }
);
