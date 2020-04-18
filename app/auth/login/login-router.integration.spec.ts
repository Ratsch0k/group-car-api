import request from 'supertest';
import app from '../../app';

describe('LoginRouter', () => {
  it('response with 400 if no username and password given', () => {
    return request(app).put('/auth/login').expect(400);
  });

  it('response with 501 if no username given', () => {
    return request(app)
        .put('/auth/login')
        .send({username: 'user', password: '1234'})
        .expect(501);
  });
});
