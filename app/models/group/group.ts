import {
  Model,
  DataTypes,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
  HasManySetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
} from 'sequelize';
import {default as sequelize} from '@db';
import {InternalError} from '@errors';
import debug from 'debug';
import {ModelHooks} from 'sequelize/types/lib/hooks';
import {User, Membership, UserDto} from '@models';

const error = debug('group-car:group:error');
const log = debug('group-car:group');


/**
 * Model for groups.
 */
export class Group extends Model {
/**
   * Id of the group.
   *
   * Primary key.
   */
  public id!: number;

  /**
   * The name of the group.
   *
   * Multiple groups can have the same name.
   */
  public name!: string;

  /**
   * The description
   */
  public description!: string;

  /**
   * The userId of the owner.
   *
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

  /**
   * List of attributes which should be used if group reference is eagerly
   * loaded.
   */
  public static simpleAttributes = [
    'id',
    'name',
    'description',
    'ownerId',
    'createdAt',
    'updatedAt',
  ];

  /**
   * Gets the owner.
   */
  public getOwner!: HasOneGetAssociationMixin<User>;

  /**
   * Sets the owner.
   */
  public setOwner!: HasOneSetAssociationMixin<User, number>;

  /**
   * Set users.
   */
  public setUsers!: HasManySetAssociationsMixin<User, number>;

  /**
   * Get users.
   */
  public getUsers!: HasManyGetAssociationsMixin<User>;

  /**
   * Add user to list.
   */
  public addUser!: HasManyAddAssociationMixin<User, number>;

  /**
   * Add users.
   */
  public addUsers!: HasManyAddAssociationMixin<User[], number>;

  /**
   * Get amount of users.
   */
  public countUsers!: HasManyCountAssociationsMixin;

  /**
   * Create new user for list.
   */
  public createUser!: HasManyCreateAssociationMixin<User>;

  /**
   * User data of the owner.
   *
   * Only exists if explicitly included in query.
   */
  public readonly Owner?: UserDto;
}

/**
 * Creates a new membership for the owner/creator of the group for that
 * group.
 *
 * Gives the owner/creator admin permissions.
 * @param group - The newly created group
 */
export const createMembershipForOwner = (
    group: Group,
): Promise<void> => {
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
  }) as unknown as Promise<void>;
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
