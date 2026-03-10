"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
require("./db/models/User");
require("./db/models/RadiologistProfile");
require("./db/models/ShiftAssignment");
require("./db/models/ImagingCategory");
require("./db/models/Requisition");
require("./db/models/RequisitionImagingItem");
require("./db/models/Visit");
require("./db/models/Assignments");
require("./db/models/BacklogThreshold");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const backlogRoutes_1 = __importDefault(require("./routes/backlogRoutes"));
const importExportRoutes_1 = __importDefault(require("./routes/importExportRoutes"));
dotenv_1.default.config();
async function bootstrap() {
    await (0, db_1.initDb)();
    await db_1.sequelize.sync();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use('/api/auth', authRoutes_1.default);
    app.use('/api/backlog', backlogRoutes_1.default);
    app.use('/api/io', importExportRoutes_1.default);
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Backend listening on port ${PORT}`);
    });
}
bootstrap().catch((err) => {
    console.error('Failed to start backend', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map