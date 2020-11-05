/* eslint-disable @typescript-eslint/no-explicit-any */
import db, {syncPromise} from '../../../../../../db';
import config from '../../../../../../config';
import supertest from 'supertest';
import {TestUtils} from '../../../../../../util/test-utils.spec';
import app from '../../../../../../app';
import {expect} from 'chai';
import {
  CarColorAlreadyInUseError,
  CarNameAlreadyInUserError,
  MaxCarAmountReachedError,
  NotAdminOfGroupError,
  UnauthorizedError,
} from '../../../../../../errors';
import {
  Car,
  CarColor,
  Group,
  GroupCarAction,
  User,
} from '../../../../../../models';
import {Server} from 'socket.io';
import ioClient from 'socket.io-client';

describe('post /api/group/:groupId/car', function() {
  const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();
  let agent: supertest.SuperTest<supertest.Test>;
  let csrf: string;
  let user: any;
  let port: number;
  let io: Server;
  let jwtValue: string;

  before(async function() {
    const socket = await TestUtils.startSocketIo();
    port = socket.port;
    io = socket.io;
  });

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();
    agent = response.agent;
    csrf = response.csrf;
    user = response. user;
    jwtValue = response.jwtValue;
  });

  after(function() {
    io.close();
  });

  describe('if user not logged in', function() {
    it('responses with 401 UnauthorizedError', function() {
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

    it('responses with 400 MaxCarAmountReachedError if group ' +
    'has max amount of cars', async function() {
      // Create group
      const group = await Group.create({
        name: 'GROUP',
        description: 'TEST',
        ownerId: user.id,
      });

      // Create cars for the group
      for (let i = 0; i < config.group.maxCars; i++) {
        await Car.create({
          groupId: group.id,
          name: `CAR-${i}`,
          color: Object.values(CarColor).filter((color) =>
            isNaN(Number(color)))[i],
          carId: i + 1,
        });
      }

      return agent.post(`/api/group/${group.id}/car`)
          .set(csrfHeaderName, csrf)
          .send({
            name: `CAR-${config.group.maxCars}`,
            color: Object.values(CarColor).filter((color) =>
              isNaN(Number(color)))[config.group.maxCars],
          })
          .expect(400)
          .then((res) => {
            expect(res.body.message)
                .to.equal(new MaxCarAmountReachedError(
                    config.group.maxCars).message);
          });
    });

    it('responses with 400 CarNameAlreadyInUserError ' +
    'if car with name already exists in group', async function() {
      // Create group
      const group = await Group.create({
        name: 'GROUP',
        description: 'TEST',
        ownerId: user.id,
      });

      // Create cars for the group
      await Car.create({
        groupId: group.id,
        name: 'CAR',
        color: Object.values(CarColor).filter((color) =>
          isNaN(Number(color)))[0],
        carId: 1,
      });

      return agent.post(`/api/group/${group.id}/car`)
          .set(csrfHeaderName, csrf)
          .send({
            name: 'CAR',
            color: Object.values(CarColor).filter((color) =>
              isNaN(Number(color)))[1],
          })
          .expect(400)
          .then((res) => {
            expect(res.body.message)
                .to.equal(new CarNameAlreadyInUserError('CAR').message);
          });
    });

    it('responses with 400 CarColorAlreadyInUseError if ' +
    'car with color already exists in group', async function() {
      // Create group
      const group = await Group.create({
        name: 'GROUP',
        description: 'TEST',
        ownerId: user.id,
      });

      // Create cars for the group
      await Car.create({
        groupId: group.id,
        name: 'CAR-1',
        color: CarColor.Black,
        carId: 1,
      });

      return agent.post(`/api/group/${group.id}/car`)
          .set(csrfHeaderName, csrf)
          .send({
            name: 'CAR-2',
            color: CarColor.Black,
          })
          .expect(400)
          .then((res) => {
            expect(res.body.message)
                .to.equal(new CarColorAlreadyInUseError(CarColor.Black)
                    .message);
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
            expect(body.carId).to.be.a('number');
            expect(body.groupId).to.equal(group.id);
            expect(body.driverId).to.be.null;
            expect(body.latitude).to.be.null;
            expect(body.longitude).to.be.null;
          });
    });

    it('increments carId within group', async function() {
      const group1 = await Group.create({
        ownerId: user.id,
        name: 'GROUP 1',
        description: 'Group 1',
      });

      for (let i = 0; i < config.group.maxCars; i++) {
        const res = await agent.post(`/api/group/${group1.id}/car`)
            .set(csrfHeaderName, csrf)
            .send({
              name: `Car ${i+1}`,
              color: Object.values(CarColor).filter((color) =>
                isNaN(Number(color)))[i],
            })
            .expect(201);

        expect(res.body.carId).to.equal(i + 1);
      }

      const group2 = await Group.create({
        ownerId: user.id,
        name: 'GROUP 2',
        description: 'Group 2',
      });

      for (let i = 0; i < config.group.maxCars; i++) {
        const res = await agent.post(`/api/group/${group2.id}/car`)
            .set(csrfHeaderName, csrf)
            .send({
              name: `Car ${i+1}`,
              color: Object.values(CarColor).filter((color) =>
                isNaN(Number(color)))[i],
            })
            .expect(201);

        expect(res.body.carId).to.equal(i + 1);
      }
    });

    it('emits update event in group namespace with new car', function() {
      return new Promise(async (resolve, reject) => {
        try {
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

          const socket = TestUtils.createSocket(
              port,
              `/group/${group.id}`,
              jwtValue,
          );

          socket.on('update', async (res: any) => {
            try {
              expect(res.action).to.equal(GroupCarAction.Add);
              const actualCar = res.car;
              expect(actualCar.groupId).to.equal(group.id);
              expect(actualCar.driverId).to.be.null;
              expect(actualCar.latitude).to.be.null;
              expect(actualCar.longitude).to.be.null;
              expect(actualCar.color).to.equal(car.color);
              expect(actualCar.name).to.equal(car.name);
              socket.close();
              resolve();
            } catch (e) {
              reject(e);
            }
          });

          return agent.post(`/api/group/${group.id}/car`)
              .set(csrfHeaderName, csrf)
              .send({name: car.name, color: car.color})
              .expect(201);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
