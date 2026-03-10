"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftAssignment = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
const User_1 = require("./User");
class ShiftAssignment extends sequelize_1.Model {
}
exports.ShiftAssignment = ShiftAssignment;
ShiftAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    radiologistId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    shiftType: {
        type: sequelize_1.DataTypes.ENUM('AM', 'PM', 'NIGHT'),
        allowNull: false,
    },
    site: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    maxRvu: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'shift_assignments',
    timestamps: true,
});
User_1.User.hasMany(ShiftAssignment, { foreignKey: 'radiologistId', as: 'shifts' });
ShiftAssignment.belongsTo(User_1.User, { foreignKey: 'radiologistId', as: 'radiologist' });
//# sourceMappingURL=ShiftAssignment.js.map