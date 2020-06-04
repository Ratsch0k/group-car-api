import {Model, DataTypes} from 'sequelize';
import {default as sequelize} from '@db';
import {Membership} from '../membership';
import {InternalError} from '@app/errors';
import debug from 'debug';

type ModelHooks = import('sequelize/types/lib/hooks').ModelHooks;

const error = debug('group-car:group:error');
const log = debug('group-car:group');

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
 * Creates a new membership for the owner/creater of the group for that
 * group.\
 * Gives the owner/creater admin permissions.
 * @param group    The newly created group
 */
export const createMembershipForOwner = (
    group: Group,
) => {
  return Membership.create({
    groupId: group.id,
    userId: group.ownerId,
    isAdmin: true,
  }).then(() => {
    log(
        'Created admin membership for user %d and group %d',
        group.ownerId,
        group.id,
    );
    return;
  }).catch((err) => {
    error(
        'Couldn\'t create admin membership for user %d and group %d, error: %o',
        group.ownerId,
        group.id,
        err,
    );
    throw new InternalError();
  });
};

// Create the hooks object
const hooks: Partial<ModelHooks> = {
  afterCreate: createMembershipForOwner,
};

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
      hooks: hooks,
    },
);

export default Group;
