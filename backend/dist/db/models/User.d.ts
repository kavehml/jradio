import { Model, Optional } from 'sequelize';
export type UserRole = 'radiologist' | 'clerical' | 'admin';
interface UserAttributes {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    active: boolean;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'active'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    active: boolean;
}
export {};
//# sourceMappingURL=User.d.ts.map