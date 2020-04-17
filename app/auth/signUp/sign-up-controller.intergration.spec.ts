import request from 'supertest';
import app from '../../app';
import {expect} from 'chai';
import RestError from '../../errors/rest-error';

describe('SignUpRouter', function() {
  describe('returns 400 if sign-up', function() {
    it('is missing username', function() {
      const body = {
        password: 'password',
        email: 'demo@mail.com',
      };

      return (request(app)
          .put('/auth/sign-up')
          .send(body))
          .expect(400)
          .then((response) => {
            expect(response.body).instanceOf(RestError);
            expect(response.body.statusCode).to.be.equal(400);
          });
    });
  });
});
