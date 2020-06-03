import {Model, DataTypes} from 'sequelize';
import {default as sequelize} from '@db';

/**
 * Model class for groups.
 */
class Group extends Model {
  /**
   * Id of the group.\
   * Primary key.
   */
  public id!: number;

  /**
   * The name of the group.\
   * Multiple groups can have the same name.
   */
  public name!: string;

  /**
   * The description
   */
  public descriptions!: string;

  /**
   * The userId of the owner.\
   * In the beginning this id will reference the user which created the group.
   * But the owner can transfer his/her ownership to another user of the group.
   */
  public ownerId!: number;

  /**
   * Date when the group was created.
   */
  public readonly createdAt!: Date;

  /**
   * Date when the group was last updated.
   */
  public readonly updatedAt!: Date;
}

/**
 * Initialize the group model.
 */
Group.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(30),
        validate: {
          notEmpty: true,
        },
      },
      description: {
        allowNull: true,
        type: DataTypes.STRING(200),
      },
    },
    {
      sequelize,
      modelName: 'group',
    },
);

export default Group;
