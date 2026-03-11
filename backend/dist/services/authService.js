"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.authenticateUser = authenticateUser;
exports.verifyToken = verifyToken;
exports.ensureAdminUser = ensureAdminUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../db/models/User");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '12h';
async function createUser(params) {
    const passwordHash = await bcrypt_1.default.hash(params.password, 10);
    const user = await User_1.User.create({
        name: params.name,
        email: params.email,
        passwordHash,
        role: params.role,
    });
    return user;
}
async function authenticateUser(email, password) {
    const user = await User_1.User.findOne({ where: { email, active: true } });
    if (!user)
        return null;
    const match = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!match)
        return null;
    const token = jsonwebtoken_1.default.sign({
        sub: user.id,
        role: user.role,
        name: user.name,
    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { user, token };
}
function verifyToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') {
        throw new Error('Invalid token payload');
    }
    const payload = decoded;
    if (!payload.sub || !payload.role || !payload.name) {
        throw new Error('Invalid token payload');
    }
    return payload;
}
// Ensure there is at least one admin user based on env vars.
async function ensureAdminUser() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
        return;
    }
    const existing = await User_1.User.findOne({ where: { email } });
    if (existing) {
        return;
    }
    await createUser({
        name: 'Admin User',
        email,
        password,
        role: 'admin',
    });
}
//# sourceMappingURL=authService.js.map