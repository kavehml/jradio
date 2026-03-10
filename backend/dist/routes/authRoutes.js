"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await (0, authService_1.authenticateUser)(email, password);
    if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { user, token } = result;
    return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
});
// Admin-only endpoint to create users (including radiologists and clerical staff)
router.post('/users', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const user = await (0, authService_1.createUser)({ name, email, password, role });
        return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create user' });
    }
});
router.get('/me', authMiddleware_1.requireAuth, (req, res) => {
    const typedReq = req;
    return res.json({ user: typedReq.user });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map