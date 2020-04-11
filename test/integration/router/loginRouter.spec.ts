import http = require('http');
import request = require('supertest');

describe('LoginRouter', () => {
  let server: http.Server;
  beforeEach(() => {
    delete require.cache[require.resolve('src/group-car')];
    server = require('src/group-car');
  });

  afterEach((done) => {
    server.close(done);
  });

  it('response with 400 if no username and password given', (done) => {
    request(server).put('/api/login').expect(400, done);
  });

  it('response with 501 if no username given', (done) => {
    request(server)
        .put('/api/login')
        .send({username: 'user', password: '1234'})
        .expect(501, done);
  });
});
