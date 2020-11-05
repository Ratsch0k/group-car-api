/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {Server} from 'socket.io';
import supertest from 'supertest';
import config from '../../../../../../../config';
import db, {syncPromise} from '../../../../../../../db';
import {
  CarInUseError,
  NotLoggedInError,
  NotMemberOfGroupError,
} from '../../../../../../../errors';
import {
  Car,
  CarColor,
  Group,
  GroupCarAction,
  User,
} from '../../../../../../../models';
import {TestUtils} from '../../../../../../../util/test-utils.spec';
import ioClient from 'socket.io-client';

describe('put /api/group/:groupId/car/:carId/drive', function() {
  const csrfName = config.jwt.securityOptions.tokenName.toLowerCase();
  let user: any;
  let agent: supertest.SuperTest<supertest.Test>;
  let csrf: string;
  let port: number;
  let io: Server;
  let jwtValue: string;

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

    user = response.user;
    agent = response.agent;
    csrf = response.csrf;
    jwtValue = response.jwtValue;
  });

  describe('if user not logged in', function() {
    it('responses with 401 NotLoggedInError', async function() {
      await agent.put('/auth/logout').set(csrfName, csrf).send().expect(204);

      const res = await agent.put('/api/group/1/car/1/drive')
          .set(csrfName, csrf)
          .send()
          .expect(401);

      expect(res.body.message).to.equal(new NotLoggedInError().message);
    });
  });

  describe('if user logged in', function() {
    describe('responses with 400 InvalidRequestError', function() {
      it('if groupId is not a numeric', function() {
        return agent.put('/api/group/test/car/1/drive')
            .set(csrfName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.include('groupId has to be a number');
            });
      });

      it('if carId is not numeric', function() {
        return agent.put('/api/group/1/car/test/drive')
            .set(csrfName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.include('carId has to be a number');
            });
      });
    });

    it('responses with 401 NotMemberOfGroupError if logged ' +
    'in user is not a member of the specified group', async function() {
      const res = await agent.put('/api/group/1/car/1/drive')
          .set(csrfName, csrf)
          .send()
          .expect(401);

      expect(res.body.message).to.equal(new NotMemberOfGroupError().message);
    });

    it('responses with 400 CarInUseError if car ' +
    'is currently in use', async function() {
      // Create group
      const group = await Group.create({
        name: 'Test',
        ownerId: user.id,
      });

      // Create user which will use the car
      const driver = await User.create({
        username: 'driver',
        email: 'driver@mail.com',
        password: 'driverpassword',
      });

      // Create car
      const car = await Car.create({
        name: 'car',
        carId: 1,
        groupId: group.id,
        driverId: driver.id,
        color: CarColor.Black,
      });

      const res = await agent
          .put(`/api/group/${group.id}/car/${car.carId}/drive`)
          .set(csrfName, csrf)
          .send()
          .expect(400);

      expect(res.body.message).to.equal(new CarInUseError().message);
    });

    it('responses with 204 and sets the logged '+
    'in user as driver', async function() {
      // Create group
      const group = await Group.create({
        name: 'Test',
        ownerId: user.id,
      });

      // Create car
      const car = await Car.create({
        name: 'car',
        carId: 1,
        groupId: group.id,
        color: CarColor.Black,
        latitude: 1.2,
        longitude: 6.4,
      });

      await agent
          .put(`/api/group/${group.id}/car/${car.carId}/drive`)
          .set(csrfName, csrf)
          .send()
          .expect(204);

      // Test if current user is driver of car
      const updatedCar = await Car.findOne({
        where: {
          groupId: group.id,
          carId: car.carId,
        },
      });

      expect(updatedCar).to.not.be.null;
      expect(updatedCar!.driverId).to.equal(user.id);
      expect(updatedCar!.latitude).to.be.null;
      expect(updatedCar!.longitude).to.be.null;
    });

    it('emit update event in group namespace ' +
    'with updated car', function() {
      return new Promise(async (resolve, reject) => {
        try {
          // Create group
          const group = await Group.create({
            name: 'Test',
            ownerId: user.id,
          });

          // Create car
          const car = await Car.create({
            name: 'car',
            carId: 1,
            groupId: group.id,
            color: CarColor.Black,
            latitude: 1.2,
            longitude: 6.4,
          });

          const socket = TestUtils.createSocket(
              port,
              `/group/${group.id}`,
              jwtValue,
          );

          socket.on('update', async (res: any) => {
            try {
              expect(res.action).to.equal(GroupCarAction.Drive);
              const actualCar = res.car;
              expect(actualCar).to.be.an('object');
              expect(actualCar.color).to.equal(car.color);
              expect(actualCar.carId).to.equal(car.carId);
              expect(actualCar.groupId).to.equal(car.groupId);
              expect(actualCar.latitude).to.be.null;
              expect(actualCar.longitude).to.be.null;
              expect(actualCar.driverId).to.equal(user.id);
              socket.close();
              resolve();
            } catch (e) {
              reject(e);
            }
          });

          await agent
              .put(`/api/group/${group.id}/car/${car.carId}/drive`)
              .set(csrfName, csrf)
              .send()
              .expect(204);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
