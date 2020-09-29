/* eslint-disable @typescript-eslint/no-explicit-any */
import db, {syncPromise} from '../../../../../../db';
import {TestUtils} from '../../../../../../util/test-utils.spec';
import config from '../../../../../../config';
import request from 'supertest';
import {expect} from 'chai';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

describe('post /api/user/invite/:groupId/join', function() {
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
    it('denies access and responses with 401', async function() {
      await agent.put('/auth/logout')
          .set(csrfHeaderName, csrf)
          .send();
      return agent
          .post('/api/user/6/join')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if logged in', function() {
    it('responses with 400 if groupId not parsable', function() {
      return agent.post('/api/user/invite/test/join')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(400)
          .then((res) => {
            expect(res.body.message).to.contain('groupId has to be a number');
          });
    });

    it('responses with 404 if user has no invite to group', function() {
      return agent.post('/api/user/invite/4/join')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(404);
    });

    it('assign the currently logged in user to the group ' +
    'if user has an invite for it', async function() {
      // Create new user, create group, invite first user, join group
      // Create new user (owner)
      await agent.post('/auth/sign-up')
          .set(csrfHeaderName, csrf)
          .send({
            username: 'owner',
            password: 'owner-password',
            email: 'owner@mail.com',
          })
          .expect(201)
          .then((res) => res.body);

      // Create group
      const group = await agent.post('/api/group')
          .set(csrfHeaderName, csrf)
          .send({
            name: 'NAME',
            description: 'DESC',
          })
          .expect(201)
          .then((res) => res.body);

      // Invite first user
      await agent.post(`/api/group/${group.id}/invite`)
          .set(csrfHeaderName, csrf)
          .send({userId: user.id})
          .expect(201);

      // Log in with first user
      await agent.put('/auth/login')
          .set(csrfHeaderName, csrf)
          .send({
            username: user.username,
            password: 'password',
          })
          .expect(200);

      // Join group
      await agent.post(`/api/user/invite/${group.id}/join`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(204);

      // Check if getting the group will return detailed information
      const userPovGroup = await agent.get(`/api/group/${group.id}`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body);

      // Check if it includes timestamp
      expect(userPovGroup).to.have.property('createdAt');
      expect(userPovGroup).to.have.property('updatedAt');

      expect(userPovGroup).to.have.property('members');
      expect(userPovGroup.members).to.be.a('array');
      userPovGroup.members.forEach((member: any) => {
        if (member.userId === user.id) {
          expect(member.User).to.eql({
            username: user.username,
            id: user.id,
          });
          expect(member.isAdmin).is.false;
        }
      });
    });
  });
});
