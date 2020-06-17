/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '../../../../config';
import request from 'supertest';
import app from '../../../../app';
import db, {syncPromise} from '../../../../db';
import {expect} from 'chai';
import {NotMemberOfGroupError, NotOwnerOfGroupError} from '../../../../errors';
import {Group, Membership, User} from '../../../../models';
import Bluebird from 'bluebird';
import sinon from 'sinon';

describe('DeleteGroup', function() {
  const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

  let csrf: string;
  let user: any;
  let agent: request.SuperTest<request.Test>;

  const signUpBody = {
    username: 'test',
    email: 'test@mail.com',
    password: 'password',
  };

  // Force sync database before each test
  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    agent = request.agent(app);

    // Get csrf token
    csrf = await agent.head('/auth')
        .then((response) => {
        // Save jwt cookie
          return response.header[csrfHeaderName];
        });

    // Sign up to access api and set new jwt
    await agent
        .post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send(signUpBody)
        .expect(201)
        .then((response) => {
          user = response.body;
        });
    csrf = await agent.head('/auth')
        .then((response) => {
          return response.header[csrfHeaderName];
        });
  });

  afterEach(function() {
    sinon.restore();
  });

  it('is only accessible if user is logged in', async function() {
    await agent.put('/auth/logout').set(csrfHeaderName, csrf).expect(204);

    await agent.delete('/api/group/3').expect(401);
  });

  it('responses with 400 if groupId is missing', function() {
    return agent.delete('/api/group/')
        .set(csrfHeaderName, csrf)
        .then((res) => console.dir(res.body));
  });

  it('responses with 400 if groupId is not a number', function() {
    return agent.delete('/api/group/test')
        .set(csrfHeaderName, csrf)
        .expect(400);
  });

  it('responses with NotMemberOfGroupError if user tries to delete a ' +
      'group he/she is not a member of', function() {
    return agent.delete('/api/group/1')
        .set(csrfHeaderName, csrf)
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .be.eql(new NotMemberOfGroupError().message);
        });
  });

  it('responses with NotOwnerOfGroupError if user is a member the group ' +
      'he/she tries to delete but not the owner', async function() {
    // Create owner of group
    const owner = await User.create({
      username: 'OWNER',
      password: 'OWNERPASSWORD',
      email: 'OWNEREMAIL@mail.com',
    });

    const group = await Group.create({
      ownerId: owner.id,
      name: 'NAME',
      description: 'DESC',
    });

    await Membership.create({
      groupId: group.id,
      userId: user.id,
      idAdmin: true,
    });

    await agent
        .delete(`/api/group/${group.id}`)
        .set(csrfHeaderName, csrf)
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .be.eql(new NotOwnerOfGroupError().message);
        });
  });

  it('responses with GroupNotFoundError if user is member of the ' +
      'group, but group doesn\'t exist', async function() {
    // Create owner of group
    const owner = await User.create({
      username: 'OWNER',
      password: 'OWNERPASSWORD',
      email: 'OWNEREMAIL@mail.com',
    });

    const group = await Group.create({
      ownerId: owner.id,
      name: 'NAME',
      description: 'DESC',
    });

    await Membership.create({
      groupId: group.id,
      userId: user.id,
      idAdmin: true,
    });

    // Stub Group.findByPk to simulate that group doesn't exist
    const groupFindByPk = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(null as any);

    await agent
        .delete(`/api/group/${group.id}`)
        .set(csrfHeaderName, csrf)
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.include(`Group with id ${group.id}`);
        });

    sinon.assert.calledOnceWithExactly(groupFindByPk as any, group.id);
  });

  it('deletes all memberships with groups and the group and' +
      'responses with 204 if user is owner of group', async function() {
    // Create owner of group
    const group = await Group.create({
      ownerId: user.id,
      name: 'NAME',
      description: 'DESC',
    });

    // Create memberships with other users to check
    // if all memberships with that group get deleted

    // Create 5 other users
    for (let i = 0; i < 5; i++) {
      const testUser = await User.create({
        username: `test-user-${i}`,
        password: `test-user-${i}`,
        email: `test-user-${i}@mail.com`,
      });

      await Membership.create({
        groupId: group.id,
        userId: testUser.id,
        isAdmin: i % 2 === 0,
      });
    }

    await agent
        .delete(`/api/group/${group.id}`)
        .set(csrfHeaderName, csrf)
        .expect(204);

    // Check if group exists
    expect(await Group.findByPk(group.id)).to.be.null;

    // Check if any membership with group exists
    const memberships = await Membership.findAll({where: {groupId: group.id}});
    expect(memberships).to.be.empty;
  });
});
