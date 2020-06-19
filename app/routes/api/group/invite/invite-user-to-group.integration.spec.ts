/* eslint-disable @typescript-eslint/no-explicit-any */
import {TestUtils} from '../../../../util/test-utils.spec';
import db, {syncPromise} from '../../../../db';
import {expect} from 'chai';
import {User, Group, Membership, Invite} from '../../../../models';
import {
  NotMemberOfGroupError,
  NotAdminOfGroupError,
  GroupNotFoundError,
  UserNotFoundError,
  GroupIsFullError,
  AlreadyInvitedError,
  AlreadyMemberError,
} from '../../../../errors';
import request from 'supertest';
import config from '../../../../config';
import Bluebird from 'bluebird';
import sinon from 'sinon';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

describe('InviteUserToGroup', function() {
  let agent: request.SuperTest<request.Test>;
  let user: any;
  let csrf: string;

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();

    agent = response.agent;
    user = response.user;
    csrf = response.csrf;
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('responses with 400', function() {
    it('if groupId is not numeric', function() {
      return agent
          .post('/api/group/test/invite')
          .set(csrfHeaderName, csrf)
          .send({userId: 10})
          .expect(400)
          .then((res) => {
            expect(res.body.message).to.contain('groupId has to be a number');
          });
    });

    it('if userId is missing', function() {
      return agent
          .post('/api/group/2/invite')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(400)
          .then((res) => {
            expect(res.body.message).to.contain('userId is missing');
          });
    });

    it('if userId is not numeric', function() {
      return agent
          .post('/api/group/2/invite')
          .set(csrfHeaderName, csrf)
          .send({userId: 'test'})
          .expect(400)
          .then((res) => {
            expect(res.body.message).to.contain('userId has to be a number');
          });
    });
  });

  it('responses with 400 and BadRequestError if user ' +
      'tries to invite himself/herself', function() {
    return agent
        .post('/api/group/1/invite')
        .set(csrfHeaderName, csrf)
        .send({userId: user.id})
        .expect(400)
        .then((res) => {
          expect(res.body.message).to.contain('You can\'t invite yourself');
        });
  });

  it('responses with 401 and NotMemberOfGroupError if user ' +
      'tries to invite to a group he/she is not a member of', function() {
    return agent
        .post('/api/group/1/invite')
        .set(csrfHeaderName, csrf)
        .send({userId: user.id + 1})
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .contain(new NotMemberOfGroupError().message);
        });
  });

  it('responses with 401 and NotAdminOfGroupError if user ' +
  'tries to invite to a group he/she is not an admin of', async function() {
    const owner = await User.create({
      username: 'OWNER',
      password: 'OWNERPASSWORD',
      email: 'OWNER@mail.com',
    });

    const group = await Group.create({
      name: 'TEST',
      description: 'TEST',
      ownerId: owner.id,
    });

    await Membership.create({
      groupId: group.id,
      userId: user.id,
      isAdmin: false,
    });

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: user.id + 1})
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .contain(new NotAdminOfGroupError().message);
        });
  });

  it('responses with 404 and GroupNotFoundError if user is admin ' +
  'of group but group doesn\'t exist', async function() {
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    const groupFindByPk = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(null as any);

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: user.id + 1})
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.be
              .eql(new GroupNotFoundError(group.id).message);
        });

    sinon.assert.calledOnceWithExactly(groupFindByPk as any, group.id);
  });

  it('responses with 404 and UserNotFound if user is admin ' +
  'but the invitee doesn\'t exist', async function() {
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: user.id + 1})
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.be
              .eql((new UserNotFoundError(user.id + 1) as any).message);
        });
  });

  it('responses with 400 and AlreadyInvitedError if user ' +
  'is admin and invitee is already invited', async function() {
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    // Create invitee
    const invitee = await User.create({
      username: 'INVITEE',
      password: 'INVITEEPASSWORD',
      email: 'INVITEE@mail.com',
    });

    // Create invitation for invitee
    await Invite.create({
      groupId: group.id,
      userId: invitee.id,
    });

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: invitee.id})
        .expect(400)
        .then((res) => {
          expect(res.body.message).to.be
              .eql(new AlreadyInvitedError(invitee.id, group.id).message);
        });
  });

  it('responses with 400 and AlreadyMemberError if user ' +
  'is admin and invitee is already a member', async function() {
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    // Create invitee
    const invitee = await User.create({
      username: 'INVITEE',
      password: 'INVITEEPASSWORD',
      email: 'INVITEE@mail.com',
    });

    // Create membership for invitee
    await Membership.create({
      groupId: group.id,
      userId: invitee.id,
      isAdmin: false,
    });

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: invitee.id})
        .expect(400)
        .then((res) => {
          expect(res.body.message).to.be
              .eql(new AlreadyMemberError(invitee.id, group.id).message);
        });
  });

  it('responses with 400 and GroupIsFullError if max amount ' +
  'of members is reached', async function() {
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    const maxMembers = config.group.maxMembers;

    // Add maxMembers - 4 to the group
    for (let i = 0; i < maxMembers - 4; i++) {
      const member = await User.create({
        username: `test-${i}-name`,
        password: `test-${i}-password`,
        email: `test-${i}@mail.com`,
      });

      await Membership.create({
        groupId: group.id,
        userId: member.id,
        isAdmin: i % 2 === 0,
      });
    }

    // Fill rest of group capacity with invites (add 5 more invites)
    for (let i = maxMembers - 4; i < maxMembers + 1; i++) {
      const member = await User.create({
        username: `test-${i}-name`,
        password: `test-${i}-password`,
        email: `test-${i}@mail.com`,
      });

      await Invite.create({
        groupId: group.id,
        userId: member.id,
      });
    }

    // Create user to invite
    const invitee = await User.create({
      username: 'INVITEE',
      password: 'INVITEEPASSWORD',
      email: 'INVITEE@mail.com',
    });

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: invitee.id})
        .expect(400)
        .then((res) => {
          expect(res.body.message).to.be.eql(new GroupIsFullError().message);
        });
  });

  it('invites user and responses with invitation', async function() {
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    // Create invitee
    const invitee = await User.create({
      username: 'INVITEE',
      password: 'INVITEEPASSWORD',
      email: 'INVITEE@mail.com',
    });

    const expectedInvite = {
      userId: invitee.id,
      groupId: group.id,
      invitedBy: user.id,
    };

    await agent
        .post(`/api/group/${group.id}/invite`)
        .set(csrfHeaderName, csrf)
        .send({userId: user.id + 1})
        .expect(201)
        .then((res) => {
          expect(res.body).to.include(expectedInvite);
          expect(res.body.createdAt).to.be.a('string');
        });

    // Check if invite exists
    const invite = await Invite.findOne({
      where: {
        groupId: group.id,
        userId: invitee.id,
      },
    });

    expect(invite).to.be.not.null;
  });
});
