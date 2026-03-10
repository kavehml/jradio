import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../db/models/User';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: UserRole;
        name: string;
    };
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRole(roles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map