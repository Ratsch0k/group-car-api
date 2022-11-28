/* eslint-disable @typescript-eslint/no-explicit-any */
import {assert, restore, stub} from 'sinon';
import {UserService} from '../../../../../models';
import ChangePasswordController from './change-password-controller';
import {expect} from 'chai';
import {BadRequestError} from '../../../../../errors';

describe('ChangePasswordController', () => {
  let user: Express.User;

  beforeEach(() => {
    user = {
      id: 1,
      username: 'test',
      email: 'test@mail.com',
      createdAt: new Date(100),
      updatedAt: new Date(100),
    };
  });

  afterEach(() => {
    restore();
  });

  describe('throws BadRequestError, if ', () => {
    it('oldPassword is not in body of request', async function() {
      const changePasswordStub = stub(UserService, 'changePassword');
      const req = {
        body: {
          newPassword: '123456',
        },
        user,
      };
      const res = {
        status: stub(),
        send: stub(),
      };

      let error;
      try {
        await ChangePasswordController(
          req as any,
          res as any,
          undefined as any,
        );
      } catch (e) {
        error = e;
      }

      expect(error).to.not.be.undefined;
      expect(error).to.be.instanceOf(BadRequestError);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
      assert.notCalled(changePasswordStub);
    });

    it('newPassword is not in body of request', async function() {
      const changePasswordStub = stub(UserService, 'changePassword');
      const req = {
        body: {
          oldPassword: '123456',
        },
        user,
      };
      const res: any = {};
      res.status = stub().returns(res);
      res.send = stub();

      let error;
      try {
        await ChangePasswordController(
          req as any,
          res as any,
          undefined as any,
        );
      } catch (e) {
        error = e;
      }

      expect(error).to.not.be.undefined;
      expect(error).to.be.instanceOf(BadRequestError);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
      assert.notCalled(changePasswordStub);
    });

    it('user is not set on request', async function() {
      const changePasswordStub = stub(UserService, 'changePassword');
      const req = {
        body: {
          oldPassword: '123456',
          newPassword: 'test',
        },
      };
      const res: any = {};
      res.status = stub().returns(res);
      res.send = stub();

      let error;
      try {
        await ChangePasswordController(
          req as any,
          res as any,
          undefined as any,
        );
      } catch (e) {
        error = e;
      }

      expect(error).to.not.be.undefined;
      expect(error).to.be.instanceOf(BadRequestError);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
      assert.notCalled(changePasswordStub);
    });
  });

  it('calls UserService to change password with old and new password, ' +
    'and sends empty message with code 204', async function() {
    const changePasswordStub = stub(UserService, 'changePassword');
    const req = {
      body: {
        oldPassword: '123456',
        newPassword: 'test',
      },
      user,
    };
    const res: any = {};
    res.status = stub().returns(res);
    res.send = stub();

    await ChangePasswordController(
      req as any,
      res as any,
      undefined as any,
    );

    assert.calledOnceWithExactly(
        changePasswordStub,
        user,
        req.body.oldPassword,
        req.body.newPassword,
    );
    assert.calledOnceWithExactly(res.status, 204);
    assert.calledOnceWithExactly(res.send);
  });
});
