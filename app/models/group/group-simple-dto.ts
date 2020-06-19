/**
 * A dto class for the {@link Group} class.
 *
 * Only has a small part of the group data because it
 * is meant for users who are not a member of the group
 * and therefore should not get all information.
 */
export class GroupSimpleDto {
  /**
   * Creates an instance of this class.
   * @param id          - Id of the group
   * @param name        - Name of the group
   * @param ownerId     - The id of the owner
   * @param description - The description of the group
   */
  constructor(id: number, name: string, ownerId: number, description: string) {
    this.id = id;
    this.name = name;
    this.ownerId = ownerId;
    this.description = description;
  }

  /**
   * The id of the group.
   */
  public id!: number;

  /**
   * The name of the group.
   */
  public name!: string;

  /**
   * The description of the group.
   */
  public description!: string;

  /**
   * The id of the owner.
   */
  public ownerId!: number;
}
