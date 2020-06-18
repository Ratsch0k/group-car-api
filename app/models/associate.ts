import {Group} from './group';
import {User} from './user';
import {ProfilePic} from './profilePicture';
import {Membership} from './membership';
import {Invite} from './invite';

/*
 * Add n:m association "Membership" between group and user
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

/*
 * Create the n:m association "Invite" between User and Group
 */
Group.belongsToMany(User, {through: Invite});
User.belongsToMany(Group, {through: Invite});
Invite.belongsTo(Group, {as: 'Group', foreignKey: 'groupId'});
Invite.belongsTo(User, {as: 'User', foreignKey: 'userId'});

/**
 * Add the invitedBy association between Invite and User
 */
Invite.belongsTo(User, {as: 'InviteSender', foreignKey: 'invitedBy'});
