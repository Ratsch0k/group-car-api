import request from 'supertest';
import app from '../../app';
import {expect} from 'chai';
import {syncPromise} from '../../db';

describe('SignUpRouter', function() {
  /**
   * Wait for sync of database before each test
   */
  beforeEach(function() {
    return syncPromise;
  });

  describe('returns 400 if', function() {
    it('request is missing username', function() {
      const body = {
        password: 'password',
        email: 'demo@mail.com',
      };

      return (request(app)
          .put('/auth/sign-up')
          .send(body))
          .expect(400)
          .then((response) => {
            expect(response.body).to.have.property('statusCode', 400);
            expect(response.body).to.have.property('status');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('timestamp');
          });
    });

    it('request is missing password', function() {
      const body = {
        username: 'demo',
        email: 'demo@mail.com',
      };

      return (request(app)
          .put('/auth/sign-up')
          .send(body))
          .expect(400)
          .then((response) => {
            expect(response.body).to.have.property('statusCode', 400);
            expect(response.body).to.have.property('status');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('timestamp');
          });
    });

    it('password is shorter than 6 characters', function() {
      const body = {
        username: 'demo',
        password: '12345',
        email: 'demo@mail.com',
      };

      return (request(app)
          .put('/auth/sign-up')
          .send(body))
          .expect(400)
          .then((response) => {
            expect(response.body).to.have.property('statusCode', 400);
            expect(response.body).to.have.property('status');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('timestamp');
          });
    });

    it('request is missing email', function() {
      const body = {
        password: 'password',
        username: 'demo',
      };

      return (request(app)
          .put('/auth/sign-up')
          .send(body))
          .expect(400)
          .then((response) => {
            expect(response.body).to.have.property('statusCode', 400);
            expect(response.body).to.have.property('status');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('timestamp');
          });
    });

    it('email property is not a valid email', function() {
      const body = {
        username: 'demo',
        password: '12345',
        email: 'demo',
      };

      return (request(app)
          .put('/auth/sign-up')
          .send(body))
          .expect(400)
          .then((response) => {
            expect(response.body).to.have.property('statusCode', 400);
            expect(response.body).to.have.property('status');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('timestamp');
          });
    });
  });

  it('creates new user', function() {
    const body = {
      username: 'demo',
      password: '123456',
      email: 'demo@mail.com',
    };

    return (request(app)
        .put('/auth/sign-up')
        .send(body))
        .expect(201)
        .then((response) => {
          expect(response.body).to.have.property('username', body.username);
          expect(response.body).to.have.property('email', body.email);
          expect(response.body).to.have.not.property('password');
          expect(response.body).to.have.property('createdAt');
          expect(response.body).to.have.property('updatedAt');
          expect(response.body).to.have.property('deletedAt');
        });
  });
});
