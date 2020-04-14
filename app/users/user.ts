import {Model, DataTypes} from 'sequelize';
import {default as sequelize} from '@db';
import bcrypt from 'bcrypt';
import config from '@config';
import PasswordNotHashableError from '@app/users/password-not-hashable-error';

type ModelHooks = import('sequelize/types/lib/hooks').ModelHooks;

/**
 * Model class for users.\
 * Represents a column of the table 'users' in the database
 */
class User extends Model {
  /**
   * The id of the user.\
   * Primary key.
   */
  public id!: number;

  /**
   * Username (not email).\
   * Is unique
   */
  public username!: string;

  /**
   * Email of the user.\
   * Is not allowed to be null or empty
   */
  public email!: string;

  /**
   * Password of the user, is hashed with bcrypt.\
   * Is not allowed to be null or empty
   */
  public password!: string;

  /**
   * Whether or not the user has access to the beta build.\
   * The default value is false and is never updated by a client request.
   */
  public isBetaUser!: boolean;

  // Timestamps
  /**
   * The date and time the user was created
   */
  public readonly createdAt!: Date;

  /**
   * The date and time the user was updated
   */
  public readonly updatedAt!: Date;

  /**
   * The date and time the user was deleted
   */
  public readonly deletedAt!: Date;
}

/**
 * Sets the password of the user to it's salted hash.
 * @param user    The user for which to hash the password
 * @param options Options
 */
const hashPasswordOfUser = (user: User, options: any) => {
  return bcrypt.hash(user.password + '', config.bcrypt.saltRounds)
      .then((hash: string) => {
        user.password = hash;
      }).catch(() => {
        throw new PasswordNotHashableError(user.username);
      });
};

/**
 * Create hooks for user model.\
 * Will be used when initializing the model.
 */
const hooks: Partial<ModelHooks> = {
  beforeSave: hashPasswordOfUser,
};

/**
 * Initialize user model
 */
User.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      isBetaUser: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'users',
      hooks,
      timestamps: true,
      paranoid: true,
    });

export default User;
