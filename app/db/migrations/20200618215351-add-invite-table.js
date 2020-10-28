'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('invites', {
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      groupId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'groups',
          key: 'id',
        },
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      invitedBy: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('invites');
  }
};
