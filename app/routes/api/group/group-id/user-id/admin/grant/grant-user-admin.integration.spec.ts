/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {syncPromise} from '../../../../../../../db';
import {TestUtils} from '../../../../../../../util/test-utils.spec';
import db from '../../../../../../../db';
import supertest from 'supertest';
import app from '../../../../../../../app';
import config from '../../../../../../../config';
import {expect} from 'chai';
import {Membership} from '../../../../../../../models';
import {
  NotAdminOfGroupError,
  NotMemberOfGroupError,
  CannotChangeOwnerMembershipError,
} from '../../../../../../../errors';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

describe('put /api/group/:groupId/:userId/admin/grant', function() {
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

  it('responses with 401 if user not logged in', function() {
    return supertest(app).put('/api/group/1/1/admin/grant')
        .set(csrfHeaderName, csrf)
        .send()
        .expect(401);
  });

  it('responses with NotMemberOfGroupError if current ' +
  'user is not member of the group', function() {
    return agent.put('/api/group/1/2/admin/grant')
        .set(csrfHeaderName, csrf)
        .send()
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .equal(new NotMemberOfGroupError().message);
        });
  });

  it('responses with NotAdminOfGroupError if current ' +
  'user is an admin of the group', async function() {
    const group = await agent.post('/api/group')
        .set(csrfHeaderName, csrf)
        .send({
          name: 'NAME',
          description: 'DESC',
        })
        .expect(201)
        .then((res) => res.body);

    // Create new user
    const notAdminUser = await agent.post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send({
          username: 'NOT_ADMIN_USER',
          password: 'NOT_ADMIN_USER',
          email: 'NOT_ADMIN@mail.com',
        }).expect(201)
        .then((res) => res.body);

    // Shortcut by creating membership for new not admin user
    await Membership.create({
      groupId: group.id,
      userId: notAdminUser.id,
      isAdmin: false,
    });

    await agent.put(`/api/group/${group.id}/8/admin/grant`)
        .set(csrfHeaderName, csrf)
        .send()
        .expect(401)
        .then((res) => {
          expect(res.body.message).to.equal(new NotAdminOfGroupError().message);
        });
  });

  it('responses with CannotChangeOwnerMembershipError ' +
  'if current user tries to change admin value of owner', async function() {
    const group = await agent.post('/api/group')
        .set(csrfHeaderName, csrf)
        .send({
          name: 'NAME',
          description: 'DESC',
        })
        .expect(201)
        .then((res) => res.body);

    // Create new user
    const notAdminUser = await agent.post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send({
          username: 'NOT_ADMIN_USER',
          password: 'NOT_ADMIN_USER',
          email: 'NOT_ADMIN@mail.com',
        }).expect(201)
        .then((res) => res.body);

    // Shortcut by creating membership for new not admin user
    await Membership.create({
      groupId: group.id,
      userId: notAdminUser.id,
      isAdmin: true,
    });

    await agent.put(`/api/group/${group.id}/${user.id}/admin/grant`)
        .set(csrfHeaderName, csrf)
        .send()
        .expect(400)
        .then((res) => {
          expect(res.body.message).to
              .equal(new CannotChangeOwnerMembershipError().message);
        });
  });

  it('changes admin value to true', async function() {
    const group = await agent.post('/api/group')
        .set(csrfHeaderName, csrf)
        .send({
          name: 'NAME',
          description: 'DESC',
        })
        .expect(201)
        .then((res) => res.body);

    // Create new user
    const notAdminUser = await agent.post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send({
          username: 'NOT_ADMIN_USER',
          password: 'NOT_ADMIN_USER',
          email: 'NOT_ADMIN@mail.com',
        }).expect(201)
        .then((res) => res.body);

    // Create admin for group
    const adminUser = await agent.post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send({
          username: 'ADMIN',
          password: 'ADMIN_PASSWORD',
          email: 'ADMIN@mail.com',
        })
        .expect(201)
        .then((res) => res.body);

    // Shortcut by creating membership for new not admin user
    await Membership.create({
      groupId: group.id,
      userId: notAdminUser.id,
      isAdmin: false,
    });

    // Shortcut by creating membership for new admin user
    await Membership.create({
      groupId: group.id,
      userId: adminUser.id,
      isAdmin: true,
    });

    // Send request while being logged in as admin
    await agent.put(`/api/group/${group.id}/${notAdminUser.id}/admin/grant`)
        .set(csrfHeaderName, csrf)
        .send()
        .expect(204);

    // Check if not admin user is now an admin
    const notAdminMembership = await Membership.findOne({
      where: {
        groupId: group.id,
        userId: notAdminUser.id,
      },
    });

    expect(notAdminMembership).to.be.not.null;
    expect(notAdminMembership!.isAdmin).to.be.true;
  });
});
