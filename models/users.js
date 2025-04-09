'use strict';
const {
  Model,
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
      User.hasOne(models.UserRole, {
        foreignKey: 'UserId',
        as: 'role'
      });
    }
  }
  User.init({
    UserId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Email: DataTypes.STRING,
    Password: DataTypes.STRING,
    FirstName: DataTypes.STRING,
    LastName: DataTypes.STRING,
    Gender: DataTypes.STRING,
    Phone: DataTypes.INTEGER,
    IsActive: DataTypes.INTEGER,
    DateUpdated: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    timestamps: false,
    tableName: 'users'
  });
  return User;
};