'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'deletedAt').then(() =>
      queryInterface.addColumn('users', 'deletedAt' ,{
        type: Sequelize.DATE,
        allowNull: true,
      })
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'deletedAt').then(() =>
      queryInterface.addColumn('users', 'deletedAt' ,{
        type: Sequelize.DATE,
      })
    );
  }
};
