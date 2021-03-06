import {Model, DataTypes, HasOneGetAssociationMixin} from 'sequelize';
import {default as sequelize} from '@db';
import {User} from '@models';

/**
 * Model class for memberships.
 *
 * If a user has joined a group,
 * this relation is stored in this table
 * as a membership.
 *
 * A membership also defines if the user
 * is an admin of the group.
 */
export class Membership extends Model {
  /**
   * Id the the user.
   */
  public readonly userId!: number;

  /**
   * Id of the group.
   */
   public readonly groupId!: number;

   /**
    * Whether or not the user is an admin of the group.
    */
  public isAdmin!: boolean;

  /**
   * Date when the membership was created.
   */
  public readonly createdAt!: Date;

  /**
   * Date when the membership was last updated.
   */
  public readonly updatedAt!: Date;

  /**
   * Gets the user.
   */
  public getUser!: HasOneGetAssociationMixin<User>;

  /**
   * User of membership.
   *
   * Exists only if explicitly included in query.
   */
  public User?: User;
}

Membership.init(
    {
      isAdmin: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'membership',
    },
);

export default Membership;
