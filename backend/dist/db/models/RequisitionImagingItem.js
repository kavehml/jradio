"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequisitionImagingItem = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
const Requisition_1 = require("./Requisition");
const ImagingCategory_1 = require("./ImagingCategory");
class RequisitionImagingItem extends sequelize_1.Model {
}
exports.RequisitionImagingItem = RequisitionImagingItem;
RequisitionImagingItem.init({
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
    modality: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    bodyParts: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    withContrast: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    specialNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    rvuValue: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    categoryId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'imaging_categories',
            key: 'id',
        },
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'requisition_imaging_items',
    timestamps: true,
});
Requisition_1.Requisition.hasMany(RequisitionImagingItem, { foreignKey: 'requisitionId', as: 'imagingItems' });
RequisitionImagingItem.belongsTo(Requisition_1.Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
ImagingCategory_1.ImagingCategory.hasMany(RequisitionImagingItem, { foreignKey: 'categoryId', as: 'requisitionItems' });
RequisitionImagingItem.belongsTo(ImagingCategory_1.ImagingCategory, { foreignKey: 'categoryId', as: 'category' });
//# sourceMappingURL=RequisitionImagingItem.js.map