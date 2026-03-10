import { User, UserRole } from '../db/models/User';
export declare function createUser(params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}): Promise<User>;
export declare function authenticateUser(email: string, password: string): Promise<{
    user: User;
    token: string;
} | null>;
export declare function verifyToken(token: string): {
    sub: number;
    role: UserRole;
    name: string;
    iat: number;
    exp: number;
};
//# sourceMappingURL=authService.d.ts.map