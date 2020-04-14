'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('users', ['username'], {
      type: 'unique',
      name: 'unique_username_constraint'
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('users','unique_username_constraint');
  }
};
