import request from 'supertest';
import app from '../../../app';
import db, {syncPromise} from '../../../db';
import {expect} from 'chai';
import config from '../../../config';
import User from '../../../models/user/user';
import jsonwebtoken from 'jsonwebtoken';

const csrfHeaderName = config.jwt.securityOptions.tokenName;

describe('LoginValidator', () => {
  let jwt: string;
  let csrf: string;

  // Force sync database before each test
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


    await syncPromise;
    return db.sync({force: true});
  });

  describe('responses with 400', function() {
    it('if no username and password given', () => {
      return request(app)
          .put('/auth/login')
          .set(csrfHeaderName, csrf)
          .set('Cookie', [jwt])
          .expect(400);
    });

    it('if user doesn\'t exist', function() {
      const body = {
        username: 'demo',
        password: 'password',
      };

      return request(app).put('/auth/login')
          .set(csrfHeaderName, csrf)
          .set('Cookie', [jwt])
          .send(body)
          .expect(400).then((response) => {
            expect(response.body).to.have
                .property('message', 'Username or email is invalid');
            expect(response.body).to.have
                .property('statusCode', 400);
          });
    });

    it('if password is wrong', async function() {
      const userData = {
        username: 'test',
        email: 'test@mail.com',
        password: 'testPassword',
      };

      const loginBody = {
        username: 'test',
        password: 'wrong password',
      };

      // Create user in database
      await User.create(userData);

      await request(app).put('/auth/login')
          .send(loginBody)
          .set(csrfHeaderName, csrf)
          .set('Cookie', [jwt])
          .expect(400)
          .then((response) => {
            expect(response.body).to.have
                .property('message', 'Username or email is invalid');
            expect(response.body).to.have.property('statusCode', 400);
          });
    });
  });

  it('logs in, if user exists and password is correct', async function() {
    const userData = {
      username: 'test',
      email: 'test@mail.com',
      password: 'testPassword',
    };

    const loginBody = {
      username: 'test',
      password: 'testPassword',
    };

    // Create user in database
    await User.create(userData);

    await request(app).put('/auth/login')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(loginBody)
        .expect(200)
        .then((response) => {
          expect(response.body).to.have
              .property('username', userData.username);
          expect(response.body).to.have.property('email', userData.email);
          expect(response.body).to.have.property('createdAt');
          expect(response.body).to.have.property('updatedAt');
          expect(response.body).to.not.have.property('password');
        });
  });

  describe('responses with 401', function() {
    it('if request is missing a jwt token', function() {
      const loginBody = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .send(loginBody)
          .expect(401);
    });

    it('if jwt token exists but without secret', function() {
      const loginBody = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .send(loginBody)
          .expect(401);
    });

    it('if csrf header exist but no jwt', function() {
      const loginBody = {
        username: 'test',
        password: 'testPassword',
      };

      jwt = jsonwebtoken.sign({username: 'username'},
          config.jwt.secret,
          config.jwt.getOptions());

      return request(app).put('/auth/login')
          .send(loginBody)
          .set('Cookie', [jwt])
          .expect(401);
    });

    it('if jwt token with secret exists ' +
        'but no header for the csrf token', function() {
      const loginBody = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .set('Cookie', [jwt])
          .send(loginBody)
          .expect(401);
    });

    it('if jwt token and csrf header ' +
        'exist, but jwt token has no secret', function() {
      const loginBody = {
        username: 'test',
        password: 'testPassword',
      };

      jwt = jsonwebtoken.sign({username: 'username'},
          config.jwt.secret,
          config.jwt.getOptions());

      return request(app).put('/auth/login')
          .set(csrfHeaderName, csrf)
          .set('Cookie', [jwt])
          .send(loginBody)
          .expect(401);
    });

    it('if jwt token with secret and csrf ' +
        'header exist, but they don\'t belong together', function() {
      const loginBody = {
        username: 'test',
        password: 'testPassword',
      };

      return request(app).put('/auth/login')
          .set(csrfHeaderName, 'FAIL')
          .set('Cookie', [jwt])
          .send(loginBody)
          .expect(401);
    });
  });
});
