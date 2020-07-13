import {User} from './user/user';
import {Group} from './group/group';
import {Membership} from './membership/membership';
import {ProfilePic} from './profile-picture/profile-pic';
import {Invite} from './invite/invite';

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

export * from './user';
export * from './group';
export * from './membership';
export * from './profile-picture';
export * from './invite';
