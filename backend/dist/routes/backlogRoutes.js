"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const backlogService_1 = require("../services/backlogService");
const router = (0, express_1.Router)();
router.get('/summary', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    const summary = await (0, backlogService_1.computeBacklogSummary)();
    return res.json({ summary });
});
router.post('/return-to-pool', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const { maxAssignmentMinutes } = req.body;
    const minutes = typeof maxAssignmentMinutes === 'number' ? maxAssignmentMinutes : 120; // default 2h
    const result = await (0, backlogService_1.returnStaleAssignmentsToPool)({ maxAssignmentMinutes: minutes });
    return res.json(result);
});
exports.default = router;
//# sourceMappingURL=backlogRoutes.js.map