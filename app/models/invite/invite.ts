import {Model} from 'sequelize';
import sequelize from '@db';

/**
 * Model for invites.
 *
 * With an invite a user can join a group.
 */
export class Invite extends Model {
  /**
   * The id of the user.
   */
  public userId!: number;

  /**
   * The id of the group.
   */
  public groupId!: number;

  /**
   * The id of the user which send this invite.
   */
  public invitedBy!: number;

  /**
   * The date and time when the invite was created.
   */
  public createdAt!: Date;
}

Invite.init(
    {},
    {
      sequelize,
      modelName: 'invite',
      updatedAt: false, // Only use createdAt
    },
);

export default Invite;
