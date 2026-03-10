"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Requisition = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
class Requisition extends sequelize_1.Model {
}
exports.Requisition = Requisition;
Requisition.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    requestedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    urgencyWindowHours: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    calculatedDueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    patientIdOrTempLabel: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isNewExternalPatient: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    orderingDoctorName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    orderingClinic: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    site: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'pending_approval', 'approved', 'scheduled', 'reported', 'returned_to_pool'),
        allowNull: false,
        defaultValue: 'pending_approval',
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'requisitions',
    updatedAt: true,
    createdAt: false,
});
//# sourceMappingURL=Requisition.js.map