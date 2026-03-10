"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogThreshold = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
class BacklogThreshold extends sequelize_1.Model {
}
exports.BacklogThreshold = BacklogThreshold;
BacklogThreshold.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    site: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    modality: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    maxPending: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    maxAgeMinutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'backlog_thresholds',
    timestamps: true,
});
//# sourceMappingURL=BacklogThreshold.js.map