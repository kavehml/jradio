"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadiologistProfile = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../index");
const User_1 = require("./User");
class RadiologistProfile extends sequelize_1.Model {
}
exports.RadiologistProfile = RadiologistProfile;
RadiologistProfile.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    subspecialties: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    maxRvuPerShift: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    sites: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
}, {
    sequelize: index_1.sequelize,
    tableName: 'radiologist_profiles',
    timestamps: true,
});
User_1.User.hasOne(RadiologistProfile, { foreignKey: 'userId', as: 'radiologistProfile' });
RadiologistProfile.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
//# sourceMappingURL=RadiologistProfile.js.map