import {User} from '@models';

/**
 * A dto object of the {@link Membership} which only
 * contains the user and if the user is an admin.
 */
export class MembershipUserDto {
  /**
   * Creates an instance of this class.
   * @param userId  - Id of the user
   * @param isAdmin - Whether the user is an admin of the group
   * @param User    - The user data
   */
  constructor(userId: number, isAdmin: boolean, User: User) {
    this.userId = userId;
    this.isAdmin = isAdmin;
    this.User = User;
  }

  /**
   * The id of the user.
   */
  public userId!: number;

  /**
   * Whether or not the user is an admin.
   */
  public isAdmin!: boolean;

  /**
   * The user data.
   */
  public User!: User;
}
