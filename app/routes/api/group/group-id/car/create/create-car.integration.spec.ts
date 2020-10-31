/* eslint-disable @typescript-eslint/no-explicit-any */
import db, {syncPromise} from '../../../../../../db';
import config from '../../../../../../config';
import supertest from 'supertest';
import {TestUtils} from '../../../../../../util/test-utils.spec';
import app from '../../../../../../app';
import {expect} from 'chai';
import {
  NotAdminOfGroupError,
  UnauthorizedError,
} from '../../../../../../errors';
import {Group, User} from '../../../../../../models';

describe('post /api/group/:groupId/car', function() {
  const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();
  let agent: supertest.SuperTest<supertest.Test>;
  let csrf: string;
  let user: any;

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();
    agent = response.agent;
    csrf = response.csrf;
    user = response. user;
  });

  describe('if user not logged in', function() {
    it('responses with 401 NotLoggedInError', function() {
      return supertest(app).post('/api/group/4/car')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401)
          .then((res) => {
            expect(res.body.message).to.equal(new UnauthorizedError().message);
          });
    });
  });

  describe('if user logged in', function() {
    describe('responses with 400 InvalidRequestError if', function() {
      it('if groupId is not numeric', function() {
        return agent
            .post('/api/group/test/car')
            .set(csrfHeaderName, csrf)
            .send({name: 'TEST', color: 'Red'})
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.include('groupId has to be a number');
            });
      });

      it('if name is not a string', function() {
        return agent
            .post('/api/group/1/car')
            .set(csrfHeaderName, csrf)
            .send({name: 1, color: 'Red'})
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.include('name has to be a string');
            });
      });

      it('if name is an empty string', function() {
        return agent
            .post('/api/group/1/car')
            .set(csrfHeaderName, csrf)
            .send({name: '', color: 'Red'})
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.include('name has to be a non empty string');
            });
      });

      it('if color is an invalid color', function() {
        return agent
            .post('/api/group/1/car')
            .set(csrfHeaderName, csrf)
            .send({name: 'TEST', color: 'NO COLOR'})
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.include('color has to be an available color');
            });
      });
    });

    describe('responses with 401 NotAdminOfGroupError', function() {
      it('if user is not a member of the group', function() {
        return agent
            .post('/api/group/1/car')
            .set(csrfHeaderName, csrf)
            .send({name: 'TEST', color: 'Red'})
            .expect(401)
            .then((res) => {
              expect(res.body.message)
                  .to.equal(new NotAdminOfGroupError().message);
            });
      });

      it('if user is a member but not an admin of the group', async function() {
        // Create owner of group
        const owner = await User.create({
          username: 'OWNER',
          email: 'owner@mail.com',
          password: 'owner password',
        });

        // Create group
        const group = await Group.create({
          name: 'TEST',
          description: 'DESC',
          ownerId: owner.id,
        });

        return agent.post(`/api/group/${group.id}/car`)
            .set(csrfHeaderName, csrf)
            .send({name: 'TEST', color: 'Red'})
            .expect(401)
            .then((res) => {
              expect(res.body.message)
                  .to.equal(new NotAdminOfGroupError().message);
            });
      });
    });

    it('creates car and returns it', async function() {
      // Create group
      const group = await Group.create({
        name: 'TEST',
        description: 'DESC',
        ownerId: user.id,
      });

      const car = {
        name: 'TEST',
        color: 'Red',
      };

      return agent.post(`/api/group/${group.id}/car`)
          .set(csrfHeaderName, csrf)
          .send({name: car.name, color: car.color})
          .expect(201)
          .then((res) => {
            const {body} = res;

            expect(new Date(body.createdAt)).to.be.a('date');
            expect(new Date(body.updatedAt)).to.be.a('date');
            expect(body.name).to.equal(car.name);
            expect(body.color).to.equal(car.color);
            expect(body.id).to.be.a('number');
            expect(body.groupId).to.equal(group.id);
            expect(body.driverId).to.be.null;
            expect(body.latitude).to.be.null;
            expect(body.longitude).to.be.null;
          });
    });
  });
});
