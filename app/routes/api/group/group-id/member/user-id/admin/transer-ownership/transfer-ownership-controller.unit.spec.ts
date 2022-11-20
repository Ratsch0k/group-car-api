import {GroupService} from '../../../../../../../../models';
import sinon, {assert} from 'sinon';
import {transferOwnershipController} from './transfer-ownership-controller';
import {BadRequestError} from '../../../../../../../../errors';
import {expect} from 'chai';

describe('TransferOwnershipController', function() {
  let req: any;
  let res: any;
  let next: any;

  let groupTransferOwnershipStub:
  sinon.SinonStub<[any, number, number], Promise<any>>;

  beforeEach(function() {
    groupTransferOwnershipStub = sinon.stub(GroupService, 'transferOwnership');

    res = {
      send: sinon.stub(),
    };

    next = sinon.stub();
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('groupId is not parsable', async function() {
      req = {
        user: {},
        params: {
          groupId: 'test',
          userId: 5,
        },
      };

      await expect(transferOwnershipController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.send);
      assert.notCalled(groupTransferOwnershipStub);
      assert.notCalled(next);
    });

    it('userId is not parsable', async function() {
      req = {
        user: {
          id: 8,
        },
        params: {
          groupId: 6,
          userId: 'test',
        },
      };

      await expect(transferOwnershipController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.send);
      assert.notCalled(groupTransferOwnershipStub);
      assert.notCalled(next);
    });

    it('currentUser is not defined', async function() {
      req = {
        params: {
          groupId: 6,
          userId: 5,
        },
      };

      await expect(transferOwnershipController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.send);
      assert.notCalled(groupTransferOwnershipStub);
      assert.notCalled(next);
    });
  });

  it('calls GroupService.transferOwnership with ' +
  'correct parameters', async function() {
    req = {
      user: {
        id: 8,
      },
      params: {
        groupId: 6,
        userId: 5,
      },
    };

    const group = {
      id: 10,
    };

    groupTransferOwnershipStub.resolves(group as any);

    await expect(transferOwnershipController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        groupTransferOwnershipStub,
        req.user,
        req.params.groupId,
        req.params.userId,
    );

    assert.calledOnceWithExactly(res.send, group as any);
    assert.notCalled(next);
  });
});
