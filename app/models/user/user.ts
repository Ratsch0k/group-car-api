import {Model, DataTypes} from 'sequelize';
import {default as sequelize} from '@db';
import bcrypt from 'bcrypt';
import config from '@config';
import {PasswordNotHashableError} from '@errors';
import {ModelHooks} from 'sequelize/types/lib/hooks';

/**
 * Model class for users.
 *
 * Represents a column of the table 'users' in the database
 */
class User extends Model {
  /**
   * The id of the user.
   *
   * Primary key.
   */
  public id!: number;

  /**
   * Username (not email).
   *
   * Is unique
   */
  public username!: string;

  /**
   * Email of the user.
   *
   * Is not allowed to be null or empty
   */
  public email!: string;

  /**
   * Password of the user, is hashed with bcrypt.
   *
   * Is not allowed to be null or empty
   */
  public password!: string;

  /**
   * Whether or not the user has access to the beta build.
   *
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

  /**
   * Search for a user by the given username.
   *
   * Only returns one instance if multiple exist.
   * @param username - The username of the user to find
   */
  public static findByUsername(username: string): Promise<User | null> {
    return this.findOne({where: {username}});
  }
}

/**
 * Sets the password of the user to it's salted hash.
 * @param user    - The user for which to hash the password
 * @param options - Options
 */
export const hashPasswordOfUser = (user: User): Promise<void> => {
  return bcrypt.hash(user.password + '', config.bcrypt.saltRounds)
      .then((hash: string) => {
        user.password = hash;
      }).catch(() => {
        throw new PasswordNotHashableError(user.username);
      });
};

/**
 * Create hooks for user model.
 *
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
        type: DataTypes.STRING(25),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          min: 4,
          max: 25,
          notContains: ' ',
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          min: 6,
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
      modelName: 'user',
      hooks,
      timestamps: true,
      paranoid: true,
    });

export default User;
