import {Model, DataTypes} from 'sequelize';
import {default as sequelize} from '@db';
import User from './user';

/**
 * This model represents the binary data for the profile picture
 * of a user.\
 * The data is in a separate table to avoid loading the data
 * every time the user data is loaded.
 */
class ProfilePic extends Model {
  /**
   * Binary data of the profile picture.
   */
  public data!: string;
}

ProfilePic.init({
  data: {
    type: DataTypes.BLOB,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'profilePics',
  timestamps: false,
});

ProfilePic.belongsTo(User);

export default ProfilePic;
