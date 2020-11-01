'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('cars', {
      carId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      groupId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'groups',
          key: 'id',
        },
      },
      name: {
        type: Sequelize.STRING(30),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      color: {
        type: Sequelize.ENUM,
        allowNull: false,
        values: ['Red', 'Green', 'Blue', 'Black', 'Yellow', 'White', 'Purple', 'Brown', 'Orange'],
      },
      latitude: {
        type: Sequelize.FLOAT,
      },
      longitude: {
        type: Sequelize.FLOAT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      driverId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    }).then(() => {
      return queryInterface.addIndex('cars', {
        fields: ['groupId', 'name'],
        unique: true,
        name: 'unique_name_per_group',
      });
    }).then(() => {
      return queryInterface.addIndex('cars', {
        fields: ['groupId', 'color'],
        unique: true,
        name: 'unique_color_per_group',
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cars');
  }
};
