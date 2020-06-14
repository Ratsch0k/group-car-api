'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn('users', 'username', {
          type: Sequelize.STRING(25),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            min: 4,
            max: 25,
            notContains: ' ',
          },
        }, {transaction: t}),
        queryInterface.changeColumn('users', 'password', {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            min: 6,
          },
        }, {transaction: t}),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn('users', 'username', {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
          },
        }, {transaction: t}),
        queryInterface.changeColumn('users', 'password', {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        }, {transaction: t}),
      ]);
    });
  }
};
