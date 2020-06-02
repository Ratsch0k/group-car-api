import db, {syncPromise} from '../../../db';
import request from 'supertest';
import app from '../../../app';
import {expect} from 'chai';

describe('GenerateProfilePic Route', function() {
  beforeEach(async function() {
    // Wait for database and force sync
    await syncPromise;
    return db.sync({force: true});
  });

  it('responses with 400 if no username given', function() {
    return request(app)
        .get('/user/generate-profile-pic')
        .expect(400);
  });

  it('responses with 200 and a picture if username given', function() {
    return request(app)
        .get('/user/generate-profile-pic?username=TEST')
        .expect('Content-Type', /image\/jpeg/)
        .expect(200);
  });

  describe('returns correct image for stored parameters:', function() {
    it('username=TEST and offset=0', function() {
      return request(app)
          .get('/user/generate-profile-pic?username=TEST')
          .expect('Content-Type', /image\/jpeg/)
          .expect(200)
          .then((response) => {
            const actualImage = response.body;
            expect(actualImage).to.be.instanceOf(Buffer);
          });
    });

    it('username=TEST and offset=12', function() {
      return request(app)
          .get('/user/generate-profile-pic?username=TEST&offset=12')
          .expect('Content-Type', /image\/jpeg/)
          .expect(200)
          .then((response) => {
            const actualImage = response.body;
            expect(actualImage).to.be.instanceOf(Buffer);
          });
    });
  });
});
