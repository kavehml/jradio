"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Visit = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
const Requisition_1 = require("./Requisition");
class Visit extends sequelize_1.Model {
}
exports.Visit = Visit;
Visit.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    visitNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
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
    scheduledDateTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'visits',
    timestamps: true,
});
Requisition_1.Requisition.hasOne(Visit, { foreignKey: 'requisitionId', as: 'visit' });
Visit.belongsTo(Requisition_1.Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
//# sourceMappingURL=Visit.js.map