/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import supertest from 'supertest';
import app from '../../../../../../app';
import config from '../../../../../../config';
import db, {syncPromise} from '../../../../../../db';
import {Group, Membership, User} from '../../../../../../models';
import {TestUtils} from '../../../../../../util/test-utils.spec';

describe('get /api/group/:groupId/member', function() {
  const csrfHeaderName = config.auth.csrfTokenName;
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
          .get('/api/group/1/member')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if user is logged in', function() {
    describe('throws BadRequestError(400) if', function() {
      it('groupId is not numeric', function() {
        return agent
            .get('/api/group/test/member')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.contain('groupId has to be a number');
            });
      });
    });

    it('responses with list of members', async function() {
      // Create group
      const group = await Group.create({
        name: 'group',
        description: 'description',
        ownerId: user.id,
      });

      // Add a few members
      const expectedMembers = [{
        isAdmin: true,
        groupId: group.id,
        userId: user.id,
        User: {
          id: user.id,
          username: user.username,
        },
      }];
      for (let i = 0; i < 5; i++) {
        const newUser = await User.create({
          username: `test-user-${i}`,
          email: `test-user-${i}@mail.com`,
          password: 'password',
        });

        // Add new user as member of group
        const member = await Membership.create({
          userId: newUser.id,
          groupId: group.id,
          isAdmin: i % 2 === 0,
        });

        expectedMembers.push({
          ...(member.get({plain: true}) as Membership),
          User: {
            id: newUser.id,
            username: newUser.username,
          },
        });
      }

      // Create other group
      await Group.create({
        name: 'other',
        description: 'other',
        ownerId: user.id,
      });

      const response = await agent
          .get(`/api/group/${group.id}/member`)
          .set(csrfHeaderName, csrf)
          .send()
          .then((res) => res.body);

      expect(response.members).to.be.an('array');
      expect(response.members).to.have.length(expectedMembers.length);
      response.members.forEach((member: any) => {
        const expectedMember = expectedMembers
            .find((el) => el.userId === member.userId);

        expect(expectedMember).to.exist;
        expect(member.User).to.eql(expectedMember!.User);
        expect(member.groupId).to.eql(expectedMember!.groupId);
        expect(member.isAdmin).to.eql(expectedMember!.isAdmin);
      });
    });
  });
});
