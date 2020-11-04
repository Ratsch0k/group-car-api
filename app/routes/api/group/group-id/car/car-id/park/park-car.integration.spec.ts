/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import supertest from 'supertest';
import config from '../../../../../../../config';
import db, {syncPromise} from '../../../../../../../db';
import {
  NotDriverOfCarError,
  NotLoggedInError,
  NotMemberOfGroupError,
} from '../../../../../../../errors';
import {TestUtils} from '../../../../../../../util/test-utils.spec';
import {Car, CarColor, Group} from '../../../../../../../models';
import { Server } from 'socket.io';

describe('put /api/group/:groupId/car/:carId/park', function() {
  const csrfName = config.jwt.securityOptions.tokenName.toLowerCase();
  let user: any;
  let csrf: string;
  let agent: supertest.SuperTest<supertest.Test>;
  let port: number;
  let io: Server;

  before(async function() {
    const socketIo = await TestUtils.startSocketIo();
    port = socketIo.port;
    io = socketIo.io;
  });

  after(function() {
    io.close();
  });

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();
    csrf = response.csrf;
    user = response.user;
    agent = response.agent;
  });

  describe('if user not logged in', function() {
    it('responses 401 NotLoggedInError', async function() {
      await agent.put('/auth/logout')
          .set(csrfName, csrf)
          .send()
          .expect(204);

      return agent.put('/api/group/5/car/8/park')
          .set(csrfName, csrf)
          .send({latitude: 1, longitude: 1})
          .expect(401)
          .then((res) => {
            expect(res.body.message).to.be
                .equal(new NotLoggedInError().message);
          });
    });
  });

  describe('if user logged in', function() {
    describe('responses with 401 InvalidRequestError', function() {
      it('if groupId is not numeric', function() {
        return agent.put('/api/group/test/car/8/park')
            .set(csrfName, csrf)
            .send({latitude: 2, longitude: 3})
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.include('groupId has to be a number');
            });
      });

      it('if carId is not numeric', function() {
        return agent.put('/api/group/4/car/test/park')
            .set(csrfName, csrf)
            .send({latitude: 2, longitude: 3})
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.include('carId has to be a number');
            });
      });

      describe('if latitude is', function() {
        it('is missing', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({longitude: 13})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('latitude is missing');
              });
        });

        it('is not a float', function() {
          return agent.put('/api/group/3/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: 'test', longitude: 3})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('latitude has to be a number ' +
                    'between -90 and 90');
              });
        });

        it('lower than -90', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: -91, longitude: 2})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('latitude has to be a ' +
                    'number between -90 and 90');
              });
        });

        it('higher than 90', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: 91, longitude: 2})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('latitude has to be a ' +
                    'number between -90 and 90');
              });
        });
      });

      describe('if longitude is', function() {
        it('is missing', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: 2})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('longitude is missing');
              });
        });

        it('is not a float', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: 2, longitude: 'test'})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('longitude has to be a '+
                        'number between -180 and 180');
              });
        });

        it('is lower than -180', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: 11, longitude: -181})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('longitude has to be a '+
                    'number between -180 and 180');
              });
        });

        it('is higher than 180', function() {
          return agent.put('/api/group/5/car/8/park')
              .set(csrfName, csrf)
              .send({latitude: 1, longitude: 181})
              .expect(400)
              .then((res) => {
                expect(res.body.message)
                    .to.include('longitude has to be a '+
                    'number between -180 and 180');
              });
        });
      });
    });

    it('responses with 401 NotMemberOfGroupError if ' +
    'user is not a member of the group', async function() {
      return agent.put('/api/group/5/car/8/park')
          .set(csrfName, csrf)
          .send({latitude: 1, longitude: 2})
          .expect(401)
          .then((res) => {
            expect(res.body.message)
                .to.include(new NotMemberOfGroupError().message);
          });
    });

    it('responses with 400 NotDriverOfCarError if user is ' +
    'not the driver of the car', async function() {
      const group = await Group.create({
        name: 'Group',
        ownerId: user.id,
      });

      const car = await Car.create({
        name: 'Car',
        groupId: group.id,
        color: CarColor.Black,
        carId: 1,
      });

      const res = await agent
          .put(`/api/group/${group.id}/car/${car.carId}/park`)
          .set(csrfName, csrf)
          .send({latitude: 1, longitude: 1})
          .expect(400);

      expect(res.body.message).to.equal(new NotDriverOfCarError().message);

      const newCar = await Car.findOne({
        where: {groupId: group.id, carId: car.carId},
      }) as Car;

      expect(newCar).to.be.not.null;

      expect(newCar.get({plain: true})).to.eql(car.get({plain: true}));
    });

    it('responses with 204 and sets driver to null ' +
    'and location if user is driver', async function() {
      const group = await Group.create({
        name: 'Group',
        ownerId: user.id,
      });

      const car = await Car.create({
        name: 'Car',
        groupId: group.id,
        color: CarColor.Black,
        driverId: user.id,
        carId: 1,
      });

      const latitude = 65;
      const longitude = 41;

      await agent
          .put(`/api/group/${group.id}/car/${car.carId}/park`)
          .set(csrfName, csrf)
          .send({latitude, longitude})
          .expect(204);

      // Check if car is updated
      const updatedCar = await Car.findOne({where: {
        groupId: group.id,
        carId: car.carId,
      }}) as Car;

      expect(updatedCar.driverId).to.be.null;
      expect(updatedCar.latitude).to.equal(latitude);
      expect(updatedCar.longitude).to.equal(longitude);
    });
  });
});
