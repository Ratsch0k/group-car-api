import config from '../../../../config';
import request from 'supertest';
import app from '../../../../app';
import db, {syncPromise} from '../../../../db';
import {expect} from 'chai';


describe('CreateGroup', function() {
  const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

  let jwt: string;
  let csrf: string;
  let user: any;

  const signUpBody = {
    username: 'test',
    email: 'test@mail.com',
    password: 'password',
  };

  // Force sync database before each test
  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    jwt = 'FAIL';
    // Get csrf token
    csrf = await request(app).head('/auth')
        .then((response) => {
          // Save jwt cookie
          jwt = response.header['set-cookie'].pop().split(';')[0];
          return response.header[csrfHeaderName];
        });

    // Sign up to access api and set new jwt
    await request(app)
        .put('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(signUpBody)
        .expect(201)
        .then((response) => {
          jwt = response.header['set-cookie'].pop().split(';')[0];
          user = response.body;
        });
    csrf = await request(app).head('/auth')
        .set('Cookie', [jwt])
        .then((response) => {
          return response.header[csrfHeaderName];
        });
  });

  it('responses with 400 if name is missing', function() {
    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .expect(400)
        .then((response) => {
          expect(response.body.message).to.include('name');
        });
  });

  it('responses with 400 if name is not a string', function() {
    const body = {
      name: 12,
    };

    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(body)
        .expect(400)
        .then((response) => {
          expect(response.body.message).to.include('name');
        });
  });

  it('responses with 400 if name is an empty string', function() {
    const body = {
      name: '',
    };

    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(body)
        .expect(400)
        .then((response) => {
          expect(response.body.message).to.include('name');
        });
  });

  it('responses with 201 if name is correct but description ' +
      'is missing', function() {
    const body = {
      name: 'NAME',
    };

    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(body)
        .expect(201)
        .then((response) => {
          expect(response.body.ownerId).to.equal(user.id);
          expect(response.body.name).to.equal(body.name);
        });
  });

  it('responses with 400 if name is correct but description ' +
      'is not a string', function() {
    const body = {
      name: 'NAME',
      description: 11,
    };

    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(body)
        .expect(400)
        .then((response) => {
          expect(response.body.message).to.include('description');
        });
  });

  it('responses with 201 if name is correct but description ' +
      'is an empty string', function() {
    const body = {
      name: 'NAME',
      description: '',
    };

    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(body)
        .expect(201)
        .then((response) => {
          expect(response.body.ownerId).to.equal(user.id);
          expect(response.body.name).to.equal(body.name);
          expect(response.body.description).to.equal(body.description);
        });
  });

  it('responses with 201 if name is correct but description ' +
      'is non empty string', function() {
    const body = {
      name: 'NAME',
      description: 'DESC',
    };

    return request(app)
        .post('/api/group')
        .set(csrfHeaderName, csrf)
        .set('Cookie', [jwt])
        .send(body)
        .expect(201)
        .then((response) => {
          expect(response.body.ownerId).to.equal(user.id);
          expect(response.body.name).to.equal(body.name);
          expect(response.body.description).to.equal(body.description);
        });
  });
});
