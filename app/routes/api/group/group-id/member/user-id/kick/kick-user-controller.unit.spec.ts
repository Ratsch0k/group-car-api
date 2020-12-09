/* eslint-disable @typescript-eslint/no-explicit-any */
import {GroupService} from '../../../../../../../models';
import sinon, {assert, match} from 'sinon';
import {expect} from 'chai';
import {kickUserController} from './kick-user-controller';
import {BadRequestError} from '../../../../../../../errors';

describe('kickUserController', function() {
  let req: any;
  let res: any;
  let next: any;

  let groupKickUser: sinon.SinonStub<any, any>;

  beforeEach(function() {
    groupKickUser = sinon.stub(GroupService, 'kickUser');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('the current user is not an object', async function() {
      req = {
        params: {
          groupId: 10,
          userId: 7,
        },
      };

      await expect(kickUserController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(groupKickUser);
    });

    it('the groupId is not parsable', async function() {
      req = {
        user: {
          id: 12,
        },
        params: {
          groupId: 'test',
          userId: 7,
        },
      };

      await expect(kickUserController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(groupKickUser);
    });

    it('the userId is not parsable', async function() {
      req = {
        user: {
          id: 12,
        },
        params: {
          groupId: 6,
          userId: 'test',
        },
      };

      await expect(kickUserController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(groupKickUser);
    });
  });

  it('calls GroupService.kickUser if all ' +
  'parameters are correct', async function() {
    req = {
      user: {
        id: 12,
      },
      params: {
        groupId: 6,
        userId: 7,
      },
    };

    const members = [
      {
        userId: 1,
        groupId: 1,
      },
    ];

    groupKickUser.resolves(members as any);

    res = {
      send: sinon.stub(),
    };

    await expect(kickUserController(req, res, next))
        .to.be.eventually.fulfilled;

    assert.calledWithExactly(
        groupKickUser,
        req.user,
        req.params.groupId,
        req.params.userId,
    );

    assert.calledOnceWithExactly(res.send, match({members}));
  });
});
