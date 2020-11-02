'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('cars', 'latitude', Sequelize.DOUBLE),
      queryInterface.changeColumn('cars', 'longitude', Sequelize.DOUBLE),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('cars', 'latitude', Sequelize.FLOAT),
      queryInterface.changeColumn('cars', 'longitude', Sequelize.FLOAT),
    ]);
  }
};
