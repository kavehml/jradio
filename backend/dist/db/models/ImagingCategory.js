"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagingCategory = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
class ImagingCategory extends sequelize_1.Model {
}
exports.ImagingCategory = ImagingCategory;
ImagingCategory.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    modality: {
        type: sequelize_1.DataTypes.ENUM('CT', 'MRI', 'Angio', 'US', 'Other'),
        allowNull: false,
    },
    bodyPart: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isSubspecialtyRestricted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    imagePath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'imaging_categories',
    timestamps: true,
});
//# sourceMappingURL=ImagingCategory.js.map