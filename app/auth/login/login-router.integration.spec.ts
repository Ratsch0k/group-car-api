import request from 'supertest';
import app from '../../app';
import db, {syncPromise} from '../../db';
import {expect} from 'chai';
import config from '../../config';
import User from '../../users/user';
// Force sync database before each test
beforeEach(async function() {
  await syncPromise;
  return db.sync({force: true});
});

describe('LoginRouter', () => {
  describe('responses with 400', function() {
    it('if no username and password given', () => {
      return request(app).put('/auth/login').expect(400);
    });

    it('if user doesn\'t exist', function() {
      const body = {
        username: 'demo',
        password: 'password',
      };

      return request(app).put('/auth/login').send(body)
          .expect(400).then((response) => {
            expect(response.body).to.have
                .property('message', 'Username or email is invalid');
            expect(response.body).to.have
                .property('statusCode', 400);
          });
    });

    it('if password is wrong', async function() {
      const signUpBody = {
        username: 'test',
        email: 'test@mail.com',
        password: 'testPassword',
      };

      const loginBody = {
        username: 'test',
        password: 'wrong password',
      };

      await request(app).put('/auth/sign-up')
          .send(signUpBody)
          .expect(201);
      await request(app).put('/auth/login')
          .send(loginBody)
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

    const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

    let jwt: string = 'FAIL';
    // Get csrf token
    const csrf = await request(app).head('/auth')
        .then((response) => {
          // Save jwt cookie
          jwt = response.header['set-cookie'].pop().split(';')[0];
          return response.header[csrfHeaderName];
        });

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
});
