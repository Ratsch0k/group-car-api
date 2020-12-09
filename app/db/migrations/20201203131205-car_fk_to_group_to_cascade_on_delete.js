'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('cars', 'cars_groupId_fkey').then(() => {
      return queryInterface.changeColumn('cars', 'groupId', {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'groups',
          key: 'id',
        },
        onDelete: 'cascade',
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('cars', 'cars_groupId_fkey').then(() => {
      return queryInterface.changeColumn('cars', 'groupId', {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'groups',
          key: 'id',
        },
      });
    });
  }
};
