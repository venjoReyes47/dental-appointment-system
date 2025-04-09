'use strict';
const {
    Model,
    DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Appointment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Define associations here
            Appointment.belongsTo(models.User, {
                foreignKey: 'PatientUserId',
                as: 'patient'
            });
            Appointment.belongsTo(models.User, {
                foreignKey: 'DentistUserId',
                as: 'dentist'
            });
            Appointment.belongsTo(models.Service, {
                foreignKey: 'ServiceId',
                as: 'service'
            });
        }
    }

    Appointment.init({
        AppointmentId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        AppointmentDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        PatientUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'UserId'
            }
        },
        DentistUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'UserId'
            }
        },
        ServiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'services',
                key: 'ServiceId'
            }
        },
        Status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Notes: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Appointment',
        timestamps: false,
        tableName: 'appointments'
    });

    return Appointment;
}; 