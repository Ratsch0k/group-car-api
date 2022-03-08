import {TestContext, TestUtils} from '../../../../../util/test-utils.spec';
import supertest from 'supertest';
import app from '../../../../../app';
import {expect} from 'chai';
import {
  IncorrectPasswordError,
  NewPasswordMustBeDifferentError,
} from '../../../../../errors';

const basePath = '/api/user/settings/change-password';

describe('post ' + basePath, function() {
  let agent: supertest.SuperAgentTest;
  let user: TestContext['user'];
  let oldPassword: string;
  let newPassword: string;

  beforeEach(async function() {
    const testContext = await TestUtils.setupIntegrationTest();
    agent = testContext.agent;
    user = testContext.user;

    oldPassword = user.password;
    newPassword = user.password + '_NEW';
  });

  describe('if user not logged in', function() {
    it('responses with UnauthorizedError', function() {
      return supertest(app).post(basePath).send().expect(401);
    });
  });

  describe('if user is logged in', function() {
    describe('rejects with BadRequestError if', function() {
      describe('oldPassword ', function() {
        it('is missing', async function() {
          const res = await agent
              .post(basePath)
              .send({newPassword})
              .expect(400);

          expect(res.body.message).to.contain('has to be a string');
        });

        it('is not a string', async function() {
          let res = await agent
              .post(basePath)
              .send({
                newPassword,
                oldPassword: 1,
              })
              .expect(400);
          expect(res.body.message).to.contain('has to be a string');

          res = await agent
              .post(basePath)
              .send({
                newPassword,
                oldPassword: {password: 'test'},
              })
              .expect(400);
          expect(res.body.message).to.contain('has to be a string');

          res = await agent
              .post(basePath)
              .send({
                newPassword,
                oldPassword: '',
              })
              .expect(400);
          expect(res.body.message).to.contain('has to be a non-empty string');
        });
      });

      describe('newPassword ', function() {
        it('is missing', async function() {
          const res = await agent
              .post(basePath)
              .send({newPassword})
              .expect(400);
          expect(res.body.message).to.contain('has to be a string');
        });

        it('is not a string', async function() {
          let res = await agent
              .post(basePath)
              .send({
                oldPassword,
                newPassword: 1,
              })
              .expect(400);
          expect(res.body.message).to.contain('has to be a string');

          res = await agent
              .post(basePath)
              .send({
                oldPassword,
                newPassword: {password: 'test'},
              })
              .expect(400);
          expect(res.body.message).to.contain('has to be a string');
        });
      });
    });

    it('rejects with 401 IncorrectPasswordError if oldPassword doesn\'t ' +
      'match new password', async function() {
      const res = await agent
          .post(basePath)
          .send({
            newPassword,
            oldPassword: oldPassword + '_incorrect',
          })
          .expect(401);

      expect(res.body.message).to.contain(new IncorrectPasswordError().message);
    });

    it('rejects with 400 NewPasswordMustBeDifferentError ' +
      'if newPassword is the same as oldPassword', async function() {
      const res = await agent
          .post(basePath)
          .send({
            oldPassword,
            newPassword: oldPassword,
          })
          .expect(400);

      expect(res.body.message).to
          .contain(new NewPasswordMustBeDifferentError().message);
    });

    it('successfully changes the user\'s password ' +
      'to newPassword', async function() {
      const res = await agent
          .post(basePath)
          .send({
            oldPassword,
            newPassword,
          })
          .expect(204);

      expect(res.body.message).to.be.undefined;
    });
  });
});
