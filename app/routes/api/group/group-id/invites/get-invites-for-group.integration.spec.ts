/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import supertest from 'supertest';
import app from '../../../../../app';
import config from '../../../../../config';
import db, {syncPromise} from '../../../../../db';
import {NotMemberOfGroupError} from '../../../../../errors';
import {Group, Invite, User} from '../../../../../models';
import {TestUtils} from '../../../../../util/test-utils.spec';

describe('get /api/group/:groupId/invites', function() {
  const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();
  let agent: supertest.SuperTest<supertest.Test>;
  let user: any;
  let csrf: string;

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();
    agent = response.agent;
    csrf = response.csrf;
    user = response.user;
  });

  describe('if user is not logged in', function() {
    it('responses with 401', function() {
      return supertest(app)
          .get('/api/group/15/invites')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if user is logged in', function() {
    describe('responses with 400 if', function() {
      it('if groupId is not numeric', function() {
        return agent
            .get('/api/group/test/invites')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.contain('groupId has to be a number');
            });
      });
    });

    it('responses with NotMemberOfGroupError if user ' +
    'is not a member of the specified group', function() {
      return agent
          .get('/api/group/51/invites')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401)
          .then((res) => {
            expect(res.body.message)
                .to.contain(new NotMemberOfGroupError().message);
          });
    });

    it('responses with the list of invites of ' +
    'the specified group', async function() {
      // Create group
      const group = await Group.create({
        name: 'TEST',
        description: 'DESCRIPTION',
        ownerId: user.id,
      });

      // Create new users to invite and invite
      const invitedUsers: any[] = [];

      for (let i = 0; i < 5; i++) {
        // Create user
        const testUser = await User.create({
          username: `test-user-${i}`,
          email: `test-user-${i}@mail.com`,
          password: `password-${i}`,
        });
        invitedUsers.push(testUser);

        // Invite user
        await Invite.create({
          userId: testUser.id,
          groupId: group.id,
          invitedBy: user.id,
        });
      }

      // Create one other group and invite
      const otherGroup = await Group.create({
        name: 'OTHER',
        description: 'OTHER',
        ownerId: user.id,
      });
      const otherUser = await User.create({
        username: 'other',
        email: 'other@mail.com',
        password: 'other-password',
      });
      await Invite.create({
        userId: otherUser.id,
        groupId: otherGroup.id,
        invitedBy: user.id,
      });

      const response = await agent
          .get(`/api/group/${group.id}/invites`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body);

      expect(response.invites).to.be.an('array');
      expect(response.invites).to.have.length(invitedUsers.length);
      response.invites.forEach((invite: any) => {
        expect(invite.invitedBy).to.be.equal(user.id);
        expect(invite.InviteSender).to.be.eql({
          username: user.username,
          id: user.id,
        });

        // Look for user in invitedUsers array
        const invitedUser = invitedUsers.find((el) => el.id === invite.userId);
        expect(invitedUser).to.be.not.undefined;

        expect(invite.userId).to.be.equal(invitedUser.id);
        expect(invite.User.id).to.be.equal(invitedUser.id);
        expect(invite.User.username).to.be.equal(invitedUser.username);
      });
    });
  });
});
