/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '../../../../config';
import supertest from 'supertest';
import db, {syncPromise} from '../../../../db';
import {TestUtils} from '../../../../util/test-utils.spec';
import app from '../../../../app';
import {expect} from 'chai';
import {User} from '../../../../models';


describe('get /api/user/search', function() {
  const csrfHeaderName = config.auth.csrfTokenName;
  let agent: supertest.SuperTest<supertest.Test>;
  let csrf: string;

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();

    agent = response.agent;
    csrf = response.csrf;
  });

  describe('if user is not logged in', function() {
    it('responses with UnauthorizedError', function() {
      return supertest(app).get('/api/user/search?filter=test')
          .set(csrfHeaderName, csrf)
          .send()
          .expect(401);
    });
  });

  describe('if user is logged in', function() {
    describe('responses with BadRequestError', function() {
      it('if filter query does not exist', function() {
        return agent.get('/api/user/search?')
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.contain('filter has to be set');
            });
      });

      it('if limit query is defined but is not numeric', function() {
        return agent.get(`/api/user/search?filter=test&limit=test`)
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.contain('limit has to be a number');
            });
      });

      it('if filter query is not a string', function() {
        return agent.get(`/api/user/search?filter[]=test&filter[]=other`)
            .set(csrfHeaderName, csrf)
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message)
                  .to.contain('filter has to be a string');
            });
      });
    });

    it('responses with list of users', async function() {
      // Put a few users into the database
      const expectedList: any = [];
      for (let i = 0; i < 5; i++) {
        const user = await User.create({
          username: `user_${i}`,
          password: `user_${i}_password`,
          email: `user_${i}@mail.com`,
        });

        expectedList.push({id: user.id, username: user.username});
      }

      // Put users into the database which should not match query
      for (let i = 0; i <4; i++) {
        await User.create({
          username: `other_${i}`,
          password: `other_${i}_password`,
          email: `other_${i}@mail.com`,
        });
      }

      const users = await agent.get(`/api/user/search?filter=user`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body.users);

      expect(users).to.be.an('array');
      expect(users).to.have.length(5);

      expect(users).to.eql(expectedList);
    });

    it('responses with list of users but limits to ' +
    'specified limit', async function() {
      // Put a few users into the database
      const expectedList: any[] = [];
      for (let i = 0; i < 5; i++) {
        const user = await User.create({
          username: `user_${i}`,
          password: `user_${i}_password`,
          email: `user_${i}@mail.com`,
        });

        expectedList.push({id: user.id, username: user.username});
      }

      // Put users into the database which should not match query
      for (let i = 0; i <4; i++) {
        await User.create({
          username: `other_${i}`,
          password: `other_${i}_password`,
          email: `other_${i}@mail.com`,
        });
      }

      const users = await agent.get(`/api/user/search?filter=user&limit=2`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body.users);

      expect(users).to.be.an('array');
      expect(users).to.have.length(2);

      expect(users).to.have.deep.members(expectedList.slice(0, 2));
    });

    it('does not return more users than max query limit even ' +
    'if query larger', async function() {
      // Put a few users into the database
      const expectedList: any[] = [];
      for (let i = 0; i < 30; i++) {
        const user = await User.create({
          username: `user_${i}`,
          password: `user_${i}_password`,
          email: `user_${i}@mail.com`,
        });

        expectedList.push({id: user.id, username: user.username});
      }

      // Put users into the database which should not match query
      for (let i = 0; i <4; i++) {
        await User.create({
          username: `other_${i}`,
          password: `other_${i}_password`,
          email: `other_${i}@mail.com`,
        });
      }

      const users = await agent.get(`/api/user/search?filter=user&limit=30`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body.users);

      expect(users).to.be.an('array');
      expect(users).to.have.length(20);

      expect(expectedList).to.include.deep.members(users);
    });

    it('responses with maximum amount of users if limit ' +
    'not defined', async function() {
      // Put a few users into the database
      const expectedList: any[] = [];
      for (let i = 0; i < 30; i++) {
        const user = await User.create({
          username: `user_${i}`,
          password: `user_${i}_password`,
          email: `user_${i}@mail.com`,
        });

        expectedList.push({id: user.id, username: user.username});
      }

      // Put users into the database which should not match query
      for (let i = 0; i <4; i++) {
        await User.create({
          username: `other_${i}`,
          password: `other_${i}_password`,
          email: `other_${i}@mail.com`,
        });
      }

      const users = await agent.get(`/api/user/search?filter=user`)
          .set(csrfHeaderName, csrf)
          .send()
          .expect(200)
          .then((res) => res.body.users);

      expect(users).to.be.an('array');
      expect(users).to.have.length(20);

      expect(expectedList).to.include.deep.members(users);
    });
  });
});
