/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import supertest from 'supertest';
import app from '../../../../../../app';
import config from '../../../../../../config';
import db, {syncPromise} from '../../../../../../db';
import {
  NotMemberOfGroupError,
} from '../../../../../../errors';
import {Car, CarColor, Group} from '../../../../../../models';
import {TestUtils} from '../../../../../../util/test-utils.spec';

describe('get /api/group/:groupId/car', function() {
  const csrfName = config.jwt.securityOptions.tokenName.toLowerCase();
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

  describe('if user not logged in', function() {
    it('responses with 401 UnauthorizedError', function() {
      return supertest(app).get('/api/group/4/car')
          .set(csrfName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if user logged in', function() {
    it('responses with 400 InvalidRequestError ' +
    'if groupId is not numeric', function() {
      return agent.get('/api/group/test/car')
          .set(csrfName, csrf)
          .send()
          .expect(400)
          .then((res) => {
            expect(res.body.message).to.include('groupId has to be a number');
          });
    });

    it('responses with 401 NotMemberOfGroup ' +
    'if user is not a member of the group', function() {
      return agent.get('/api/group/4/car')
          .set(csrfName, csrf)
          .send()
          .expect(401)
          .then((res) => {
            expect(res.body.message).to
                .equal(new NotMemberOfGroupError().message);
          });
    });

    it('responses with 200 and the list of cars', async function() {
      // Create group
      const group = await Group.create({
        name: 'GROUP',
        description: 'TEST',
        ownerId: user.id,
      });

      const expectedCars = [];
      // Create cars for the group
      for (let i = 0; i < 4; i++) {
        const car = await Car.create({
          groupId: group.id,
          name: `CAR-${i}`,
          color: Object.values(CarColor)[i],
        });

        const carObject = car.get({plain: true}) as any;
        carObject.createdAt = carObject.createdAt.toISOString();
        carObject.updatedAt = carObject.updatedAt.toISOString();
        carObject.Driver = null;
        expectedCars.push(car.get({plain: true}));
      }

      const response = await agent.get(`/api/group/${group.id}/car`)
          .set(csrfName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body);

      expect(response).to.haveOwnProperty('cars');
      expect(response.cars).to.be.an('array');
      expect(response.cars).to.have.length(expectedCars.length);
      expect(response.cars).to.eql(expectedCars);
    });

    it('will only response with the cars of the ' +
    'specified group and not of other groups', async function() {
      // Create group
      const group = await Group.create({
        name: 'GROUP',
        description: 'TEST',
        ownerId: user.id,
      });

      const expectedCars = [];
      // Create cars for the group
      for (let i = 0; i < 4; i++) {
        const car = await Car.create({
          groupId: group.id,
          name: `CAR-${i}`,
          color: Object.values(CarColor)[i],
        });

        const carObject = car.get({plain: true}) as any;
        carObject.createdAt = carObject.createdAt.toISOString();
        carObject.updatedAt = carObject.updatedAt.toISOString();
        carObject.Driver = null;
        expectedCars.push(car.get({plain: true}));
      }

      // Create other group and cars
      const otherGroup = await Group.create({
        name: 'OTHER',
        description: 'OTHER',
        ownerId: user.id,
      });

      const otherCar = await Car.create({
        groupId: otherGroup.id,
        name: 'OTHER-CAR',
        color: 'Blue',
      });

      const response = await agent.get(`/api/group/${group.id}/car`)
          .set(csrfName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body);

      expect(response).to.haveOwnProperty('cars');
      expect(response.cars).to.be.an('array');
      expect(response.cars).to.have.length(expectedCars.length);
      expect(response.cars).to.eql(expectedCars);
      expect(response.cars.some((car: any) =>
        car.id === otherCar.id)).to.be.false;
    });
  });
});
