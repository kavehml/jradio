import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User, UserRole } from '../db/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '12h';

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<User> {
  const passwordHash = await bcrypt.hash(params.password, 10);
  const user = await User.create({
    name: params.name,
    email: params.email,
    passwordHash,
    role: params.role,
  });
  return user;
}

export async function authenticateUser(email: string, password: string) {
  const user = await User.findOne({ where: { email, active: true } });
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { user, token };
}

export function verifyToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  const payload = decoded as JwtPayload & { sub: number; role: UserRole; name: string };
  if (!payload.sub || !payload.role || !payload.name) {
    throw new Error('Invalid token payload');
  }
  return payload as { sub: number; role: UserRole; name: string; iat: number; exp: number };
}
