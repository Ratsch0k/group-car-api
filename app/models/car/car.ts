import {DataTypes, Model} from 'sequelize';
import {User} from '@models';
import {default as sequelize} from '@db';
import {CarColor} from './car-color';

/**
 * Model class for cars.
 *
 * A car can only exist in the context of a
 * group.
 */
export class Car extends Model {
  /**
   * Id of the group.
   */
  public readonly groupId!: number;

  /**
   * Id of the car.
   */
  public readonly id!: number;

  /**
   * Name of the car.
   */
  public name!: string;

  /**
   * Date when the car was created.
   */
  public readonly createdAt!: Date;

  /**
   * Date when the car was last updated.
   */
  public readonly updatedAt!: Date;

  /**
   * The color of the car.
   */
  public color!: CarColor;

  /**
   * The id of the driver
   */
  public driverId!: number | null;

  /**
   * The driver.
   */
  public Driver?: User;

  /**
   * Latitude of the location of the car.
   */
  public latitude?: number;

  /**
   * Longitude of the location of the car.
   */
  public longitude?: number;
}

Car.init(
    {
      id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      color: {
        type: DataTypes.ENUM,
        values: Object.values(CarColor)
            .filter((value) => isNaN(Number(value))) as string[],
        allowNull: false,
      },
      latitude: DataTypes.FLOAT,
      longitude: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: 'car',
    },
);

export default Car;
