/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert, match} from 'sinon';
import {BadRequestError} from '../../../../../errors';
import {InviteService} from '../../../../../models';
import {getInvitesForGroupController} from './get-invites-for-group-controller';

describe('getInvitesController', function() {
  let req: any;
  let res: any;
  let next: any;
  let findAllForGroupStub: sinon.SinonStub;

  beforeEach(function() {
    res = {
      send: sinon.stub(),
    };

    next = sinon.stub();

    findAllForGroupStub = sinon.stub(InviteService, 'findAllForGroup');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('groupId is missing in params', async function() {
      req = {
        user: {
          id: 12,
        },
        params: {},
      };

      await expect(getInvitesForGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(next);
      assert.notCalled(res.send);
      assert.notCalled(findAllForGroupStub);
    });

    it('groupId exists but cannot be converted ' +
    'to an integer', async function() {
      req = {
        user: {
          id: 12,
        },
        params: {
          groupId: 'test',
        },
      };

      await expect(getInvitesForGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(next);
      assert.notCalled(res.send);
      assert.notCalled(findAllForGroupStub);
    });

    it('if user is missing on request', async function() {
      req = {
        params: {
          groupId: '14',
        },
      };

      await expect(getInvitesForGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(next);
      assert.notCalled(res.send);
      assert.notCalled(findAllForGroupStub);
    });
  });

  describe('sends invites for specified group', async function() {
    req = {
      params: {
        groupId: '14',
      },
      user: {
        id: 61,
      },
    };

    const invites = [
      {
        groupId: 14,
        userId: 61,
      },
      {
        groupId: 14,
        userId: 62,
      },
    ];

    findAllForGroupStub.resolves(invites);

    await expect(getInvitesForGroupController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(res.send, match({invites}));
    assert.calledOnceWithExactly(findAllForGroupStub, req.user, req.group);
    assert.notCalled(next);
  });
});
