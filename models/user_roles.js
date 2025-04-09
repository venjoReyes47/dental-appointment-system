'use strict';
const {
    Model,
    DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class UserRole extends Model {
        static associate(models) {
            // Define associations here
            UserRole.belongsTo(models.User, {
                foreignKey: 'UserId',
                as: 'user'
            });
        }
    }
    UserRole.init({
        UserRoleId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'UserId'
            }
        },
        RoleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2 // Default to patient role
        },
        DateUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'UserRole',
        timestamps: false,
        tableName: 'user_roles'
    });
    return UserRole;
}; 