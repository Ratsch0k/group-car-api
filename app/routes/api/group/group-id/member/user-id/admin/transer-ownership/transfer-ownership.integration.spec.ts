/* eslint-disable @typescript-eslint/no-explicit-any */
import supertest from 'supertest';
import {TestUtils} from '../../../../../../../../util/test-utils.spec';
import db, {syncPromise} from '../../../../../../../../db';
import app from '../../../../../../../../app';
import config from '../../../../../../../../config';
import {expect} from 'chai';
import {
  UnauthorizedError,
  NotOwnerOfGroupError,
  UserNotMemberOfGroupError,
  UserNotAdminOfGroupError,
} from '../../../../../../../../errors';
import {Group, Invite, Membership, User} from '../../../../../../../../models';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

describe('post /api/group/:groupId/member/' +
':userId/admin/transfer-ownership', function() {
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

  describe('if user not logged in', function() {
    it('responses with UnauthorizedError', function() {
      return supertest(app)
          .post('/api/group/1/member/1/admin/transfer-ownership')
          .send()
          .set(csrfHeaderName, csrf)
          .expect(401);
    });
  });

  describe('if user logged in', function() {
    describe('response with', function() {
      it('BadRequestError if groupId is not a number', function() {
        return agent.post('/api/group/test/member/5/admin/transfer-ownership')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.contain('groupId has to be a number');
            });
      });

      it('BadRequestError if userId is not a number', function() {
        return agent.post('/api/group/1/member/test/admin/transfer-ownership')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.contain('userId has to be a number');
            });
      });

      it('UnauthorizedError if current user is ' +
      'not a member of the group and has no invite for it', function() {
        return agent.post('/api/group/1/member/1/admin/transfer-ownership')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(401)
            .then((res) => {
              expect(res.body.message).to
                  .contain(new UnauthorizedError().message);
            });
      });

      describe('NotOwnerOfGroupError if the current user', function() {
        let owner: User;
        let group: Group;

        // Before each request login with a different user and create a group
        beforeEach(async function() {
          owner = await User.create({
            username: 'owner',
            password: 'owner-password',
            email: 'owner@mail.com',
          });

          group = await Group.create({
            name: 'NAME',
            description: 'DESC',
            ownerId: owner.id,
          });
        });

        it('only has an invite for the group', async function() {
          // Invite user
          await Invite.create({
            userId: user.id,
            groupId: group.id,
            invitedBy: owner.id,
          });

          // Try to transfer ownership
          await agent
              .post(`/api/group/${group.id}/member/6/admin/transfer-ownership`)
              .set(csrfHeaderName, csrf)
              .send()
              .expect(401)
              .then((res) => {
                expect(res.body.message).to.be
                    .eql(new NotOwnerOfGroupError().message);
              });
        });

        it('is only a member of the group', async function() {
          // Create membership for user
          await Membership.create({
            userId: user.id,
            groupId: group.id,
            isAdmin: false,
          });

          // Try to transfer ownership
          await agent
              .post(`/api/group/${group.id}/member/6/admin/transfer-ownership`)
              .set(csrfHeaderName, csrf)
              .send()
              .expect(401)
              .then((res) => {
                expect(res.body.message).to.be
                    .eql(new NotOwnerOfGroupError().message);
              });
        });

        it('is only an admin of the group', async function() {
          // Create membership for user
          await Membership.create({
            userId: user.id,
            groupId: group.id,
            isAdmin: true,
          });

          // Try to transfer ownership
          await agent
              .post(`/api/group/${group.id}/member/6/admin/transfer-ownership`)
              .set(csrfHeaderName, csrf)
              .send()
              .expect(401)
              .then((res) => {
                expect(res.body.message).to
                    .be.eql(new NotOwnerOfGroupError().message);
              });
        });
      });

      it('UserNotMemberOfGroupError if the user to which the ownership ' +
      'should be transferred to is not a member ' +
      'of the group', async function() {
        // Create group with user as owner
        const group = await Group.create({
          name: 'NAME',
          description: 'DESC',
          ownerId: user.id,
        });

        // Create user to transfer ownership to
        const toUser = await User.create({
          username: 'TOUSER',
          password: 'TOUSERPASSWORD',
          email: 'touser@mail.com',
        });

        // Try to transfer ownership
        await agent.post(`/api/group/${group.id}/member/${toUser.id}/` +
        'admin/transfer-ownership')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.be
                  .eql(new UserNotMemberOfGroupError(toUser.id).message);
            });
      });

      it('UserNotAdminOfGroupError if the user to which the ' +
      'ownership should be transferred to is not an admin ' +
      'of the group', async function() {
        // Create group with user as owner
        const group = await Group.create({
          name: 'NAME',
          description: 'DESC',
          ownerId: user.id,
        });

        // Create user to transfer ownership to
        const toUser = await User.create({
          username: 'TOUSER',
          password: 'TOUSERPASSWORD',
          email: 'touser@mail.com',
        });

        // Create membership for new user
        await Membership.create({
          userId: toUser.id,
          groupId: group.id,
          isAdmin: false,
        });

        // Try to transfer ownership
        await agent.post(`/api/group/${group.id}/member/${toUser.id}/` +
                'admin/transfer-ownership')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.be
                  .eql(new UserNotAdminOfGroupError(toUser.id).message);
            });
      });

      it('transfers the ownership successfully and responses ' +
      'with the updated group data', async function() {
        // Create group with user as owner
        const group = await Group.create({
          name: 'NAME',
          description: 'DESC',
          ownerId: user.id,
        });

        // Create user to transfer ownership to
        const toUser = await User.create({
          username: 'TOUSER',
          password: 'TOUSERPASSWORD',
          email: 'touser@mail.com',
        });

        // Create membership for new user
        await Membership.create({
          userId: toUser.id,
          groupId: group.id,
          isAdmin: true,
        });

        // Try to transfer ownership
        await agent.post(`/api/group/${group.id}/member/${toUser.id}/` +
                        'admin/transfer-ownership')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(200)
            .then((res) => {
              expect(res.body).to.haveOwnProperty('id');
              expect(res.body).to.haveOwnProperty('name');
              expect(res.body).to.haveOwnProperty('description');
              expect(res.body).to.haveOwnProperty('Owner');
              expect(res.body.Owner).to.haveOwnProperty('id', toUser.id);
            });
      });
    });
  });
});
