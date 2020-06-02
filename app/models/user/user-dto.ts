/**
 * The data transfer object for {@link User}
 */
class UserDto {
  /**
   * Creates an instance of this class.
   * @param username    Username
   * @param email       Email
   * @param isBetaUser  Whether or not the user has access to the beta version
   * @param createdAt   When the user was created
   * @param updatedAt   When the user was last updated
   * @param deletedAt   When the user was deleted
   */
  constructor(
      id: number,
      username: string,
      email: string,
      isBetaUser: boolean,
      createdAt: Date,
      updatedAt: Date,
      deletedAt: Date) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.isBetaUser = isBetaUser;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  /**
   * Primary key.
   */
  public id: number;

  /**
   * Username (not email).\
   * Is unique
   */
  public username: string;

  /**
   * Email of the user.\
   * Is not allowed to be null or empty
   */
  public email: string;

  /**
   * Whether or not the user has access to the beta build.\
   * The default value is false and is never updated by a client request.
   */
  public isBetaUser: boolean;

  // Timestamps
  /**
   * The date and time the user was created
   */
  public createdAt: Date;

  /**
   * The date and time the user was updated
   */
  public updatedAt: Date;

  /**
   * The date and time the user was deleted
   */
  public deletedAt: Date;
}

export default UserDto;
