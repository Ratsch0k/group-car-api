/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {UserService} from '../../../../models';
import {expect} from 'chai';
import {searchUserController} from './search-user-controller';
import {BadRequestError} from '../../../../errors';

describe('searchUserController', function() {
  let req: any;
  let res: any;
  let next: any;
  let serviceStub: sinon.SinonStub<any, any>;

  beforeEach(function() {
    serviceStub = sinon.stub(UserService, 'findLimitedWithFilter');

    res = {
      send: sinon.stub(),
    };
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('query.filter is not a string', async function() {
      req = {
        query: {
          filter: 10,
          limit: 10,
        },
      };

      await expect(searchUserController(req, res, next))
          .to.be.eventually.rejectedWith(BadRequestError);

      assert.notCalled(serviceStub);
      assert.notCalled(res.send);
    });

    it('query.limit is neither a string nor undefined', async function() {
      req = {
        query: {
          filter: 'test',
          limit: 10,
        },
      };

      await expect(searchUserController(req, res, next))
          .to.be.eventually.rejectedWith(BadRequestError);

      assert.notCalled(serviceStub);
      assert.notCalled(res.send);
    });

    it('user is not defined', async function() {
      req = {
        query: {
          filter: 'test',
          limit: 10,
        },
      };

      await expect(searchUserController(req, res, next))
          .to.be.eventually.rejectedWith(BadRequestError);

      assert.notCalled(serviceStub);
      assert.notCalled(res.send);
    });
  });

  describe('calls service method with', function() {
    it('with query.limit parsed to an int if defined', async function() {
      req = {
        user: {},
        query: {
          filter: 'test',
          limit: '10',
        },
      };

      const users = [
        {
          id: 1,
          username: 'test1',
        },
        {
          id: 2,
          username: 'test2',
        },
      ];

      serviceStub.resolves(users as any);

      await expect(searchUserController(req, res, next))
          .to.be.fulfilled;

      assert.calledOnceWithExactly(serviceStub, req.user, req.query.filter, 10);
      assert.calledOnceWithExactly(res.send, match({users}));
    });

    it('with query.limit as undefined when not defined', async function() {
      req = {
        user: {},
        query: {
          filter: 'test',
        },
      };

      const users = [
        {
          id: 1,
          username: 'test1',
        },
        {
          id: 2,
          username: 'test2',
        },
      ];

      serviceStub.resolves(users as any);

      await expect(searchUserController(req, res, next))
          .to.be.fulfilled;

      assert.calledOnceWithExactly(
          serviceStub,
          req.user,
          req.query.filter,
          undefined,
      );
      assert.calledOnceWithExactly(res.send, match({users}));
    });
  });
});
