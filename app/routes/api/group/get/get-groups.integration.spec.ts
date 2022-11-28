/* eslint-disable @typescript-eslint/no-explicit-any */
import db, {syncPromise} from '../../../../db';
import {TestUtils} from '../../../../util/test-utils.spec';
import supertest from 'supertest';
import config from '../../../../config';
import app from '../../../../app';
import {Group, User} from '../../../../models';
import {expect} from 'chai';

describe('get /api/group', function() {
  const csrfHeaderName = config.auth.csrfTokenName;
  let agent: supertest.SuperTest<supertest.Test>;
  let csrf: string;
  let user: any;

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();

    agent = response.agent;
    csrf = response.csrf;
    user = response.user;
  });

  describe('if user not logged in', function() {
    it('responses with UnauthorizedError', function() {
      return supertest(app)
          .get('/api/group')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if user logged in', function() {
    it('responses with list of groups', async function() {
      const N = 5;

      const correctIds = [];
      // Create groups and memberships for user
      for (let i = 0; i < N; i++) {
        const group = await Group.create({
          name: 'test_group_1',
          description: 'test_group_1',
          ownerId: user.id,
        });

        correctIds.push(group.id);
      }

      // Create another user and another group
      // to check if only groups of currently logged in user are returned
      const otherUser = await User.create({
        username: 'other',
        password: 'other_password',
        email: 'other@mail.com',
      });

      const otherGroup = await Group.create({
        name: 'other_group',
        description: 'other_group',
        ownerId: otherUser.id,
      });

      const response = await agent.get('/api/group')
          .set(csrfHeaderName, csrf)
          .send()
          .then((res) => res.body);

      expect(response.groups).to.be.an('array');

      const groups = response.groups as any[];
      expect(groups).to.have.length(N);

      for (let i = 0; i < N; i++) {
        const id = correctIds[i];

        expect(groups.some((g) => g.id === id)).to.be.true;
      }

      expect(groups.every((g) => g.id !== otherGroup.id)).to.be.true;
    });
  });
});
