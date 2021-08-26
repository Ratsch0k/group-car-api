/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {Server} from 'socket.io';
import supertest from 'supertest';
import config from '../../config';
import db, {syncPromise} from '../../db';
import {NotLoggedInError, NotMemberOfGroupError} from '../../errors';
import {TestUtils} from '../../util/test-utils.spec';
import {User} from '../user';
import Group from './group';
import http from 'http';

describe('GroupNotificationService', function() {
  const csrfName = config.jwt.securityOptions.tokenName.toLowerCase();
  let io: Server;
  let port: number;
  let csrf: string;
  let user: any;
  let agent: supertest.SuperTest<supertest.Test>;
  let jwtValue: string;
  let server: http.Server;

  before(async function() {
    const socketIo = await TestUtils.startSocketIo();
    io = socketIo.io;
    port = socketIo.port;
    server = socketIo.server;
  });

  after(function() {
    io.close();
    server.close();
  });

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();
    agent = response.agent;
    csrf = response.csrf;
    user = response.user;
    jwtValue = response.jwtValue;
  });

  describe('can\'t connect to group namespace', function() {
    it('emits error event with NotLoggedInError if user ' +
    'is not logged in', function() {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await agent.put('/auth/logout')
              .set(csrfName, csrf)
              .send()
              .expect(204);
          const loggedOutJwtValue = TestUtils
              .extractJwtValue(res.header['set-cookie']);
          expect(loggedOutJwtValue).not.to.be.undefined;

          const group = await Group.create({
            name: 'group',
            ownerId: user.id,
          });

          const socket = TestUtils.createSocket(
              port,
              `/group/${group.id}`,
              loggedOutJwtValue,
          );

          socket.on('error', (e: any) => {
            try {
              expect(e).to.be.a('string');
              expect(e).to.equal(new NotLoggedInError().message);
              socket.close();
              resolve(true);
            } catch (e) {
              socket.close();
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    it('and emits error event with NotMemberOfGroupError ' +
    'if user is logged in but not a member of the group', function() {
      return new Promise(async (resolve, reject) => {
        try {
          const owner = await User.create({
            username: 'owner',
            email: 'owner@mail.com',
            password: 'owner-password',
          });

          const group = await Group.create({
            name: 'group',
            ownerId: owner.id,
          });

          const socket = TestUtils.createSocket(
              port,
              `/group/${group.id}`,
              jwtValue,
          );

          socket.on('error', (e: any) => {
            try {
              expect(e).to.be.a('string');
              expect(e).to.equal(new NotMemberOfGroupError().message);
              socket.close();
              resolve(true);
            } catch (e) {
              socket.close();
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    it('emits error event with NotMemberOfGroupError ' +
    'if user is logged in group doesn\'t exist', function() {
      return new Promise(async (resolve, reject) => {
        try {
          const socket = TestUtils.createSocket(
              port,
              '/group/5',
              jwtValue,
          );

          socket.on('error', (e: any) => {
            try {
              expect(e).to.be.a('string');
              expect(e).to.equal(new NotMemberOfGroupError().message);
              socket.close();
              resolve(true);
            } catch (e) {
              socket.close();
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('can connect to namespace if user is logged in ' +
  'and is member of group', function() {
    return new Promise(async (resolve, reject) => {
      try {
        const group = await Group.create({
          name: 'group',
          ownerId: user.id,
        });

        const socket = TestUtils
            .createSocket(port, `/group/${group.id}`, jwtValue);

        socket.on('connect', () => {
          socket.close();
          resolve(true);
        });

        socket.on('connect_error', (e: any) => {
          socket.close();
          reject(e);
        });

        socket.on('error', (e: any) => {
          socket.close();
          reject(e);
        });

        socket.on('connect_timeout', (e: any) => {
          socket.close();
          reject(e);
        });

        socket.open();
      } catch (e) {
        io.close();
        server.close();
        reject(e);
      }
    });
  });
});
