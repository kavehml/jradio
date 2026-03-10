"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const importExportService_1 = require("../services/importExportService");
const router = (0, express_1.Router)();
// Admin or clerical can import outpatient schedules from CSV text
router.post('/outpatient-csv', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'clerical']), async (req, res) => {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') {
        return res.status(400).json({ error: 'csv string is required in body' });
    }
    try {
        const result = await (0, importExportService_1.importOutpatientCsv)(csv);
        return res.status(201).json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to import CSV' });
    }
});
// Admin can export RVU summary as CSV
router.get('/rvu-summary', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
        return res.status(400).json({ error: 'from and to query params (ISO dates) are required' });
    }
    try {
        const csv = await (0, importExportService_1.exportRvuSummaryCsv)(new Date(from), new Date(to));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="rvu-summary.csv"');
        return res.send(csv);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to generate export CSV' });
    }
});
exports.default = router;
//# sourceMappingURL=importExportRoutes.js.map