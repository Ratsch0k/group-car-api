/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '../../../../../config';
import request from 'supertest';
import app from '../../../../../app';
import db, {syncPromise} from '../../../../../db';
import {expect} from 'chai';
import {Group, Membership, User} from '../../../../../models';
import sinon from 'sinon';
import Bluebird from 'bluebird';


describe('put /api/group/:groupId', function() {
  describe('user is not logged in:', function() {
    let agent: request.SuperTest<request.Test>;

    // Force sync database before each test
    beforeEach(async function() {
      await syncPromise;
      await db.sync({force: true});

      agent = request.agent(app);
    });

    it('responses with 401', function() {
      return agent.put('/api/group/10').expect(401);
    });
  });

  describe('user is logged in:', function() {
    const csrfHeaderName = config.auth.csrfTokenName;

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

    it('responses with 401 if user not member of group', function() {
      return agent.put('/api/group/1').expect(401);
    });

    it('responses with 401 if user not admin of group', function() {
      // Create owner of group
      const ownerData = {
        username: 'OWNER',
        password: 'OWNER PASSWORD',
        email: 'OWNER@OWNER.com',
      };
      // Create the database entries manually and then send request
      return User.create(ownerData).then((owner) => {
        expect(owner).to.be.not.null;
        const groupData = {
          name: 'TEST',
          description: 'DESC',
          ownerId: owner.id,
        };
        return Group.create(groupData);
      }).then((group) => {
        expect(group).to.be.not.null;
        return Membership.create({
          groupId: group.id,
          userId: user.id,
          isAdmin: false,
        }).then(() => group);
      }).then((group) =>
        agent.put(`/api/group/${group.id}`)
            .set(csrfHeaderName, csrf).expect(401));
    });

    it('responses with 404 if user is admin of group but ' +
        'group doesn\'t exist', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };

      // Stub Group.findByPk to simulate that the group somehow doesn't
      // exist. Could be an extreme edge case
      const groupFindByPkStub: any = sinon.stub(Group, 'update')
          .usingPromise(Bluebird).resolves([0, []]);

      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .expect(404))
          .then(() => {
            sinon.assert.calledOnce(groupFindByPkStub);
            sinon.restore();
          });
    });

    it('responses with 400 if name if not a string', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };
      const requestBody = {
        name: 10,
      };
      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .send(requestBody)
                .expect(400));
    });

    it('responses with 400 if name is an empty string', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };
      const requestBody = {
        name: '',
      };
      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .send(requestBody)
                .expect(400));
    });

    it('changes name field of group successfully', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };
      const requestBody = {
        name: 'new name',
      };
      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .send(requestBody)
                .expect(200).then((response) => {
                  expect(response.body).to.include({
                    name: requestBody.name,
                    description: groupData.description,
                    ownerId: groupData.ownerId,
                  });
                }));
    });

    it('responses with 400 if descriptions is not a string', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };
      const requestBody = {
        description: 14,
      };
      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .send(requestBody)
                .expect(400));
    });

    it('changes descriptions field successfully', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };
      const requestBody = {
        description: 'new desc',
      };
      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .send(requestBody)
                .expect(200).then((response) => {
                  expect(response.body).to.include({
                    name: groupData.name,
                    description: requestBody.description,
                    ownerId: groupData.ownerId,
                  });
                }));
    });

    it('cannot changes ownerId of group', function() {
      // Create the database entries manually and then send request
      const groupData = {
        name: 'name',
        description: 'desc',
        ownerId: user.id,
      };
      const requestBody = {
        ownerId: 6,
      };
      return Group.create(groupData)
          .then((group) =>
            agent.put(`/api/group/${group.id}`)
                .set(csrfHeaderName, csrf)
                .send(requestBody)
                .expect(400));
    });
  });
});
