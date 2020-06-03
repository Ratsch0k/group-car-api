import {Group} from './group';
import {User} from './user';
import {ProfilePic} from './profilePicture';
import {Membership} from './membership';

/*
 * Add n:m association between group and user
 */
Group.belongsToMany(User, {through: Membership});
User.belongsToMany(Group, {through: Membership});
Membership.belongsTo(Group, {as: 'Group', foreignKey: 'groupId'});
Membership.belongsTo(User, {as: 'User', foreignKey: 'userId'});

/*
 * Add the 1:n association between groups and users
 */
Group.belongsTo(User, {
  as: 'Owner',
  foreignKey: 'ownerId',
});

ProfilePic.belongsTo(User);
