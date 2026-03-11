"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../db/models/User");
const RadiologistProfile_1 = require("../db/models/RadiologistProfile");
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
// Admin-only endpoint to list all users with basic info and radiologist subspecialties
router.get('/users', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const users = await User_1.User.findAll({
            include: [{ model: RadiologistProfile_1.RadiologistProfile, as: 'radiologistProfile' }],
            order: [['id', 'ASC']],
        });
        const data = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            active: u.active,
            radiologistProfile: u.radiologistProfile &&
                'subspecialties' in u.radiologistProfile
                ? {
                    subspecialties: u.radiologistProfile.subspecialties,
                    maxRvuPerShift: u.radiologistProfile.maxRvuPerShift,
                    sites: u.radiologistProfile.sites,
                }
                : null,
        }));
        return res.json({ users: data });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to load users' });
    }
});
// Admin-only endpoint to update a radiologist's subspecialties (and optional RVU/sites)
router.put('/users/:id/radiologist-profile', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }
    const body = req.body;
    try {
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role !== 'radiologist') {
            return res.status(400).json({ error: 'Only radiologists can have subspecialties' });
        }
        const subspecialties = (Array.isArray(body.subspecialties) ? body.subspecialties : []);
        const maxRvuPerShift = body.maxRvuPerShift ?? null;
        const sites = Array.isArray(body.sites) ? body.sites : [];
        const [profile] = await RadiologistProfile_1.RadiologistProfile.findOrCreate({
            where: { userId: user.id },
            defaults: {
                userId: user.id,
                subspecialties,
                maxRvuPerShift,
                sites,
            },
        });
        if (!profile.isNewRecord) {
            profile.subspecialties = subspecialties;
            profile.maxRvuPerShift = maxRvuPerShift;
            profile.sites = sites;
            await profile.save();
        }
        return res.json({
            id: profile.id,
            userId: profile.userId,
            subspecialties: profile.subspecialties,
            maxRvuPerShift: profile.maxRvuPerShift,
            sites: profile.sites,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update radiologist profile' });
    }
});
router.get('/me', authMiddleware_1.requireAuth, (req, res) => {
    const typedReq = req;
    return res.json({ user: typedReq.user });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map