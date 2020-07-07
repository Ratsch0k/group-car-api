/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '../../../../config';
import db, {syncPromise} from '../../../../db';
import app from '../../../../app';
import request from 'supertest';
import {expect} from 'chai';
import {Invite, Group, User, Membership} from '../../../../models';
import Bluebird from 'bluebird';
import sinon from 'sinon';

describe('GetGroup', function() {
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

  it('only accessible if user is logged in', async function() {
    await agent.post('/auth/logout');

    await agent.get('/api/group/12').send().expect(401);
  });

  it('responses with 400 if groupId is not numeric', function() {
    return agent
        .get('/api/group/test')
        .send()
        .expect(400)
        .then((res) => {
          expect(res.body.message).to.contain('groupId has to be a number');
        });
  });

  it('responses with UnauthorizedError if user is ' +
      'not a member and has no invite', function() {
    return agent.get('/api/group/1').send().expect(401);
  });

  it('responses with GroupNotFoundError if authorized to access group ' +
      'which doesn\'t exist', async function() {
    const group = await Group.create({
      name: 'TEST',
      description: 'TEST',
      ownerId: user.id,
    });

    await Invite.create({
      groupId: group.id,
      userId: user.id,
    });

    // Stub Group.findByPk to simulate that Group doesn't exist
    const groupFindByPkStub = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(null as any);

    await agent.get(`/api/group/${group.id}`).send().expect(404);

    sinon.assert.calledOnceWithExactly(groupFindByPkStub as any, group.id);
  });

  it('responses with simple version of group if user ' +
      'is no member but has invite', async function() {
    const owner = await User.create({
      username: 'OWNER',
      password: 'OWNER',
      email: 'OWNER@mail.com',
    });

    const group = await Group.create({
      name: 'TEST',
      description: 'TEST',
      ownerId: owner.id,
    });

    await Invite.create({
      groupId: group.id,
      userId: user.id,
    });

    await agent
        .get(`/api/group/${group.id}`)
        .send()
        .expect(200)
        .then((res) => {
          expect(res.body).to.include({
            name: group.name,
            description: (group as any).description,
            ownerId: group.ownerId,
          });
          expect(res.body).to.not.have.property('members');
          expect(res.body).to.not.have.property('createdAt');
          expect(res.body).to.not.have.property('updatedAt');
        });
  });

  it('responses with group data and list of members if user ' +
  'is member', async function() {
    const group = await Group.create({
      name: 'TEST',
      description: 'TEST',
      ownerId: user.id,
    });

    // Create invite for other users
    const expectedMemberList: any = [{
      User: {
        username: user.username,
        id: user.id,
      },
      isAdmin: true,
    }];

    for (let i = 0; i < 5; i++) {
      const member = await User.create({
        username: `test-${i}-name`,
        password: `test-${i}-password`,
        email: `test-${i}@mail.com`,
      });

      expectedMemberList.push({
        User: {
          username: member.username,
          id: member.id,
        },
        isAdmin: i % 2 === 0,
      });

      await Membership.create({
        groupId: group.id,
        userId: member.id,
        isAdmin: i % 2 === 0,
      });
    }

    await agent
        .get(`/api/group/${group.id}`)
        .send()
        .expect(200)
        .then((res) => {
          expect(res.body).to.include({
            id: group.id,
            name: group.name,
            description: (group as any).description,
            ownerId: group.ownerId,
          });
          expect(res.body.members).to.eql(expectedMemberList);
        });
  });
});
