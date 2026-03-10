"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.initDb = initDb;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const databaseUrl = process.env.DATABASE_URL;
exports.sequelize = databaseUrl
    ? new sequelize_1.Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: false,
    })
    : new sequelize_1.Sequelize(process.env.DB_NAME || 'radiology_rvu', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: false,
    });
async function initDb() {
    try {
        await exports.sequelize.authenticate();
        console.log('Database connection established');
    }
    catch (err) {
        console.error('Unable to connect to database', err);
        throw err;
    }
}
//# sourceMappingURL=index.js.map