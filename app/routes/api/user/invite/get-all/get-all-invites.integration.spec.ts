/* eslint-disable @typescript-eslint/no-explicit-any */
import db, {syncPromise} from '../../../../../db';
import {TestUtils} from '../../../../../util/test-utils.spec';
import request from 'supertest';
import {expect, assert} from 'chai';
import config from '../../../../../config';
import {User, Group, Invite} from '../../../../../models';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

describe('GetAllInvites', function() {
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

  describe('if not logged in', function() {
    it('responses with 401', async function() {
      await agent.put('/auth/logout')
          .set(csrfHeaderName, csrf)
          .send();
      return agent
          .get('/api/user/invite')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if logged in', function() {
    it('responses with empty list if user has no invites', function() {
      agent.get('/api/user/invite')
          .expect(200)
          .then((response) => {
            expect(response.body).to.eql({
              invites: [],
            });
          });
    });

    it('responses with correct invites', async function() {
      // Creates users and groups for which the invites can be generated
      const groupIds = [];
      for (let i = 0; i < 5; i++) {
        const testUser = await User.create({
          username: `test-user-${i}-name`,
          password: `test-user-${i}-pass`,
          email: `test-user-${i}-email@mail.com`,
        });

        const group = await Group.create({
          name: `test-group-${i}-name`,
          description: `test-group-${i}-desc`,
          ownerId: testUser.id,
        });

        await Invite.create({
          userId: user.id,
          groupId: group.id,
        });

        groupIds.push(group.id);
      }

      const response = await agent.get('/api/user/invite')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200);

      // Check if all invites exists
      expect(response.body.invites).to.exist.and.to.be.an('array');
      expect(response.body.invites).to.have.length(groupIds.length);

      const invites = response.body.invites as Array<any>;
      groupIds.forEach((id) => {
        assert(invites.some((invite) => invite.Group.id === id));
      });

      invites.every((invite) => {
        expect(invite.userId).to.equal(user.id);
      });
    });

    it('only responses with invites of logged in user', async function() {
      // Create group an invite for logged in user
      const owner = await User.create({
        username: `owner-name`,
        password: `owner-pass`,
        email: `owner-email@mail.com`,
      });
      const group = await Group.create({
        name: `test-group-name`,
        description: `test-group-desc`,
        ownerId: owner.id,
      });
      await Invite.create({
        userId: user.id,
        groupId: group.id,
      });

      // Create other user and invite for him/her
      const otherUser = await User.create({
        username: `other-name`,
        password: `other-pass`,
        email: `other-email@mail.com`,
      });
      await Invite.create({
        userId: otherUser.id,
        groupId: group.id,
      });

      const response = await agent.get('/api/user/invite')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200);

      // Check if all invites exists
      expect(response.body.invites).to.exist.and.to.be.an('array');
      expect(response.body.invites).to.have.length(1);

      const invites = response.body.invites as Array<any>;

      invites.every((invite) => {
        expect(invite.userId).to.equal(user.id);
      });
    });

    it('only provides detailed information about ' +
    'group and invite sender', async function() {
      // Create group an invite for logged in user
      const owner = await User.create({
        username: `owner-name`,
        password: `owner-pass`,
        email: `owner-email@mail.com`,
      });
      const group = await Group.create({
        name: `test-group-name`,
        description: `test-group-desc`,
        ownerId: owner.id,
      });
      await Invite.create({
        userId: user.id,
        groupId: group.id,
        invitedBy: owner.id,
      });

      const response = await agent.get('/api/user/invite')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200);

      // Check if all invites exists
      expect(response.body.invites).to.exist.and.to.be.an('array');
      expect(response.body.invites).to.have.length(1);

      const invite = (response.body.invites as Array<any>)[0];

      expect(invite.Group).to.exist;
      expect(invite.Group.Owner).to.exist;
      expect(owner).to.include(invite.Group.Owner);
      expect(invite.Group.id).to.be.equal(group.id);
      expect(invite.Group.name).to.be.equal(group.name);
      expect(invite.Group.description).to.be.equal((group as any).description);

      expect(invite.InviteSender).to.exist;
      expect(owner).to.include(invite.InviteSender);
    });
  });
});
