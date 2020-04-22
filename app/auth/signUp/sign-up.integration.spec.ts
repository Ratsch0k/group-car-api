import request from 'supertest';
import app from '../../app';
import {expect} from 'chai';
import {syncPromise} from '../../db';
import config from '../../config';
import jsonwebtoken from 'jsonwebtoken';

describe('SignUpRouter', function() {
  const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();
  let jwt: string;
  let csrf: string;

  /**
   * Wait for sync of database before each test
   */
  beforeEach(async function() {
    const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

    jwt = 'FAIL';
    // Get csrf token
    csrf = await request(app).head('/auth')
        .then((response) => {
          // Save jwt cookie
          jwt = response.header['set-cookie'].pop().split(';')[0];
          return response.header[csrfHeaderName];
        });

    return syncPromise;
  });

  describe('returns 400 if', function() {
    it('request is missing username', async function() {
      const body = {
        password: 'password',
        email: 'demo@mail.com',
      };

      return (request(app)
          .put('/auth/sign-up')
          .set('Cookie', [jwt])
          .set(csrfHeaderName, csrf)
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
          .set('Cookie', [jwt])
          .set(csrfHeaderName, csrf)
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
          .set('Cookie', [jwt])
          .set(csrfHeaderName, csrf)
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
          .set('Cookie', [jwt])
          .set(csrfHeaderName, csrf)
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
          .set('Cookie', [jwt])
          .set(csrfHeaderName, csrf)
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
        .set('Cookie', [jwt])
        .set(csrfHeaderName, csrf)
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

  describe('responses with 401', function() {
    it('if request is missing a jwt token', function() {
      const body = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .send(body)
          .expect(401);
    });

    it('if jwt token exists but without secret', function() {
      const body = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .send(body)
          .expect(401);
    });

    it('if csrf header exist but no jwt', function() {
      const body = {
        username: 'test',
        password: 'testPassword',
      };

      jwt = jsonwebtoken.sign({username: 'username'},
          config.jwt.secret,
          config.jwt.getOptions());

      return request(app).put('/auth/login')
          .send(body)
          .set('Cookie', [jwt])
          .expect(401);
    });

    it('if jwt token with secret exists ' +
        'but no header for the csrf token', function() {
      const body = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .set('Cookie', [jwt])
          .send(body)
          .expect(401);
    });

    it('if jwt token and csrf header ' +
        'exist, but jwt token has no secret', function() {
      const body = {
        username: 'test',
        password: 'testPassword',
      };

      jwt = jsonwebtoken.sign({username: 'username'},
          config.jwt.secret,
          config.jwt.getOptions());

      return request(app).put('/auth/login')
          .set(csrfHeaderName, csrf)
          .set('Cookie', [jwt])
          .send(body)
          .expect(401);
    });

    it('if jwt token with secret and csrf ' +
        'header exist, but they don\'t belong together', function() {
      const body = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .set(csrfHeaderName, 'FAIL')
          .set('Cookie', [jwt])
          .send(body)
          .expect(401);
    });
  });
});
