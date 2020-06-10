import {Model, DataTypes} from 'sequelize';
import {default as sequelize} from '@db';

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
class Membership extends Model {
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
