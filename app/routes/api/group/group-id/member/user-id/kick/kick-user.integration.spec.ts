/* eslint-disable @typescript-eslint/no-explicit-any */
import db, {syncPromise} from '../../../../../../../db';
import {TestUtils} from '../../../../../../../util/test-utils.spec';
import config from '../../../../../../../config';
import supertest from 'supertest';
import app from '../../../../../../../app';
import {expect} from 'chai';
import {
  UnauthorizedError,
  NotMemberOfGroupError,
  NotAdminOfGroupError,
  NotOwnerOfGroupError,
  MembershipNotFoundError,
  CannotKickSelfError,
} from '../../../../../../../errors';
import {Group, User, Membership} from '../../../../../../../models';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

/**
 * Creates the url to be tested based on the parameters.
 * @param groupId - The group id of the request
 * @param userId  - The user id of the request
 */
const createTestUrl = (groupId: any, userId: any) => {
  return `/api/group/${groupId}/member/${userId}/kick`;
};

describe('post /api/group/:groupId/member/:userId/kick', function() {
  let agent: supertest.SuperTest<supertest.Test>;
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

  describe('if user is not logged in', function() {
    it('responses with UnauthorizedError', function() {
      return supertest(app)
          .post(createTestUrl(1, 1))
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401)
          .then((res) => {
            expect(res.body.message).to
                .be.equal(new UnauthorizedError().message);
          });
    });
  });

  describe('if user is logged', function() {
    describe('responses with', function() {
      describe('BadRequestError if', function() {
        it('groupId is not a number', function() {
          return agent.post(createTestUrl('test', 1))
              .set(csrfHeaderName, csrf)
              .send()
              .expect(400)
              .then((res) => {
                expect(res.body.message).to
                    .contain('groupId has to be a number');
              });
        });

        it('userId is not a number', function() {
          return agent.post(createTestUrl(1, 'test'))
              .set(csrfHeaderName, csrf)
              .send()
              .expect(400)
              .then((res) => {
                expect(res.body.message).to
                    .contain('userId has to be a number');
              });
        });
      });

      it('CannotKickSelfError if current user tries ' +
      'to kick himself/herself', async function() {
        return agent.post(createTestUrl(1, user.id))
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to
                  .equal(new CannotKickSelfError().message);
            });
      });

      it('NotMemberOfGroup if current user is not a ' +
      'member of the specified group', async function() {
        return agent.post(createTestUrl(1, user.id + 1))
            .set(csrfHeaderName, csrf)
            .send()
            .expect(401)
            .then((res) => {
              expect(res.body.message).to
                  .equal(new NotMemberOfGroupError().message);
            });
      });

      it('NotAdminOfGroup if current user is not an admin ' +
      'of the specified group', async function() {
        // Create owner for group
        const owner = await User.create({
          username: 'owner',
          password: 'owner_password',
          email: 'owner@mail.com',
        });

        // Create group
        const group = await Group.create({
          name: 'name',
          description: 'description',
          ownerId: owner.id,
        });

        // Create not-admin membership for current user
        await Membership.create({
          userId: user.id,
          groupId: group.id,
          isAdmin: false,
        });

        // Try to kick a member
        await agent.post(createTestUrl(group.id, 77))
            .set(csrfHeaderName, csrf)
            .expect(401)
            .then((res) => {
              expect(res.body.message).to
                  .be.equal(new NotAdminOfGroupError().message);
            });
      });

      it('MembershipNotFound if specified user is not a ' +
      'member of the specified group', async function() {
        // Create owner for group
        const owner = await User.create({
          username: 'owner',
          password: 'owner_password',
          email: 'owner@mail.com',
        });

        // Create group
        const group = await Group.create({
          name: 'name',
          description: 'description',
          ownerId: owner.id,
        });

        // Create admin membership for current user
        await Membership.create({
          userId: user.id,
          groupId: group.id,
          isAdmin: true,
        });

        const toKickId = 77;

        // Try to kick a member
        await agent.post(createTestUrl(group.id, toKickId))
            .set(csrfHeaderName, csrf)
            .expect(404)
            .then((res) => {
              expect(res.body.message).to
                  .be.equal(new MembershipNotFoundError({
                    userId: toKickId,
                    groupId: group.id,
                  }).message);
            });
      });

      it('NotOwnerOfGroup if specified user is an admin ' +
      'of the group and the current user is not the owner', async function() {
        // Create owner for group
        const owner = await User.create({
          username: 'owner',
          password: 'owner_password',
          email: 'owner@mail.com',
        });

        // Create group
        const group = await Group.create({
          name: 'name',
          description: 'description',
          ownerId: owner.id,
        });

        // Create a user to kick
        const userToKick = await User.create({
          username: 'to_kick_user',
          password: 'to_kick_password',
          email: 'to_kick@mail.com',
        });

        // Create admin membership for user to kick
        await Membership.create({
          userId: userToKick.id,
          groupId: group.id,
          isAdmin: true,
        });

        // Create admin membership for current user
        await Membership.create({
          userId: user.id,
          groupId: group.id,
          isAdmin: true,
        });

        // Try to kick a member
        await agent.post(createTestUrl(group.id, userToKick.id))
            .set(csrfHeaderName, csrf)
            .expect(401)
            .then((res) => {
              expect(res.body.message).to
                  .be.equal(new NotOwnerOfGroupError().message);
            });
      });
    });

    describe('kicks the specified user from the specified group ' +
    'and responses with the new group data', function() {
      it('if the specified user is a normal member and ' +
      'the current user is an admin', async function() {
        // Create owner for group
        const owner = await User.create({
          username: 'owner',
          password: 'owner_password',
          email: 'owner@mail.com',
        });

        // Create group
        const group = await Group.create({
          name: 'name',
          description: 'description',
          ownerId: owner.id,
        });

        // Create a user to kick
        const userToKick = await User.create({
          username: 'to_kick_user',
          password: 'to_kick_password',
          email: 'to_kick@mail.com',
        });

        // Create not-admin membership for user to kick
        await Membership.create({
          userId: userToKick.id,
          groupId: group.id,
          isAdmin: false,
        });

        // Create admin membership for current user
        await Membership.create({
          userId: user.id,
          groupId: group.id,
          isAdmin: true,
        });

        // Try to kick a member
        const newGroup = await agent.post(createTestUrl(
            group.id,
            userToKick.id,
        )).set(csrfHeaderName, csrf)
            .expect(200)
            .then((res) => res.body);

        expect(newGroup).has.ownProperty('members');
        expect(newGroup.members).to.be.an('array');
        const users: any[] = newGroup.members;

        // Check that no member has the id of the kicked member
        users.forEach((element) => {
          expect(element.id).to.not.eql(userToKick.id);
        });

        // To be sure, check that membership doesn't exist anymore
        const toKickMembership = await Membership.findOne({
          where: {
            userId: userToKick.id,
            groupId: group.id,
          },
        });
        expect(toKickMembership).to.be.null;
      });

      it('if the specified user is an admin and the ' +
      'current user is the owner', async function() {
        // Create group
        const group = await Group.create({
          name: 'name',
          description: 'description',
          ownerId: user.id,
        });

        // Create a user to kick
        const userToKick = await User.create({
          username: 'to_kick_user',
          password: 'to_kick_password',
          email: 'to_kick@mail.com',
        });

        // Create not-admin membership for user to kick
        await Membership.create({
          userId: userToKick.id,
          groupId: group.id,
          isAdmin: true,
        });

        // Try to kick a member
        const newGroup = await agent.post(createTestUrl(
            group.id,
            userToKick.id,
        )).set(csrfHeaderName, csrf)
            .expect(200)
            .then((res) => res.body);

        expect(newGroup).has.ownProperty('members');
        expect(newGroup.members).to.be.an('array');
        const users: any[] = newGroup.members;

        // Check that no member has the id of the kicked member
        users.forEach((element) => {
          expect(element.id).to.not.eql(userToKick.id);
        });

        // To be sure, check that membership doesn't exist anymore
        const toKickMembership = await Membership.findOne({
          where: {
            userId: userToKick.id,
            groupId: group.id,
          },
        });
        expect(toKickMembership).to.be.null;
      });
    });
  });
});
