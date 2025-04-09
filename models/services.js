'use strict';
const {
    Model,
    DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Service extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Define associations here
            Service.hasMany(models.Appointment, {
                foreignKey: 'ServiceId',
                as: 'appointments'
            });
        }
    }

    Service.init({
        ServiceId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        DateCreated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        DateUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Service',
        timestamps: false,
        tableName: 'services'
    });

    return Service;
}; 