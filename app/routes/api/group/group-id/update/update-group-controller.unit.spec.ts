/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {GroupService} from '../../../../../models';
import {expect} from 'chai';
import {
  BadRequestError,
} from '../../../../../errors';
import {updateGroupController} from './index';

describe('updateGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let updateGroup: sinon.SinonStub;
  let user: Express.User;

  beforeEach(function() {
    updateGroup = sinon.stub(GroupService, 'update');
    res = {
      send: sinon.stub(),
    };
    next = sinon.stub();
    user = {
      id: 51,
    } as Express.User;
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('user is missing on request', async function() {
      const groupId = 15;
      req = {
        body: {
          name: 'NEW_NAME',
        },
        params: {
          groupId,
        },
      };

      await expect(updateGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(updateGroup);
    });

    it('groupId is missing on request', async function() {
      req = {
        user,
        body: {
          name: 'NEW_NAME',
        },
        params: {
        },
      };

      await expect(updateGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(updateGroup);
    });

    it('groupId on request is not numeric', async function() {
      const groupId = 'NOT_NUMERIC';
      req = {
        user,
        body: {
          name: 'NEW_NAME',
        },
        params: {
          groupId,
        },
      };

      await expect(updateGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(updateGroup);
      assert.notCalled(res.send);
    });
  });

  it('calls GroupService.update with correct values and ' +
    'response with updated group', async function() {
    const groupId = 51;
    req = {
      user,
      body: {
        name: 'NEW_NAME',
      },
      params: {
        groupId,
      },
    };
    const group = {
      id: groupId,
      name: req.body.name,
    };
    updateGroup.resolves(group);

    await expect(updateGroupController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        updateGroup,
        user,
        groupId,
        match({name: req.body.name}),
    );
    assert.calledOnceWithExactly(res.send, group);
  });
});
