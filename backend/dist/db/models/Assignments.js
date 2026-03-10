"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingAssignment = exports.ProtocolAssignment = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
const Requisition_1 = require("./Requisition");
const User_1 = require("./User");
const ShiftAssignment_1 = require("./ShiftAssignment");
class ProtocolAssignment extends sequelize_1.Model {
}
exports.ProtocolAssignment = ProtocolAssignment;
ProtocolAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    requisitionId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'requisitions',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    protocolingRadiologistId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    assignedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('assigned', 'completed', 'returned_to_pool'),
        allowNull: false,
        defaultValue: 'assigned',
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'protocol_assignments',
    timestamps: false,
});
class ReportingAssignment extends sequelize_1.Model {
}
exports.ReportingAssignment = ReportingAssignment;
ReportingAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    requisitionId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'requisitions',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    reportingRadiologistId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    shiftId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'shift_assignments',
            key: 'id',
        },
    },
    assignedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('assigned', 'completed', 'returned_to_pool'),
        allowNull: false,
        defaultValue: 'assigned',
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'reporting_assignments',
    timestamps: false,
});
Requisition_1.Requisition.hasMany(ProtocolAssignment, { foreignKey: 'requisitionId', as: 'protocolAssignments' });
ProtocolAssignment.belongsTo(Requisition_1.Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
Requisition_1.Requisition.hasMany(ReportingAssignment, { foreignKey: 'requisitionId', as: 'reportingAssignments' });
ReportingAssignment.belongsTo(Requisition_1.Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
User_1.User.hasMany(ProtocolAssignment, {
    foreignKey: 'protocolingRadiologistId',
    as: 'protocolAssignments',
});
ProtocolAssignment.belongsTo(User_1.User, {
    foreignKey: 'protocolingRadiologistId',
    as: 'protocolingRadiologist',
});
User_1.User.hasMany(ReportingAssignment, {
    foreignKey: 'reportingRadiologistId',
    as: 'reportingAssignments',
});
ReportingAssignment.belongsTo(User_1.User, {
    foreignKey: 'reportingRadiologistId',
    as: 'reportingRadiologist',
});
ShiftAssignment_1.ShiftAssignment.hasMany(ReportingAssignment, { foreignKey: 'shiftId', as: 'assignments' });
ReportingAssignment.belongsTo(ShiftAssignment_1.ShiftAssignment, { foreignKey: 'shiftId', as: 'shift' });
//# sourceMappingURL=Assignments.js.map