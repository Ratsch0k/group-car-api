/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import Sinon, {assert, match} from 'sinon';
import sinon from 'sinon';
import {BadRequestError} from '../../../../../errors';
import {MembershipService} from '../../../../../models/membership';
import {getMembersOfGroupController} from './get-members-of-group-controller';

describe('getMembersOfGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let findAllForGroup: Sinon.SinonStub;

  beforeEach(function() {
    next = sinon.stub();
    res = {
      send: sinon.stub(),
    };

    findAllForGroup = sinon.stub(MembershipService, 'findAllForGroup');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('user is missing', async function() {
      req = {
        params: {
          groupId: '12',
        },
      };

      await expect(getMembersOfGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(next);
      assert.notCalled(res.send);
      assert.notCalled(findAllForGroup);
    });

    it('groupId is not numeric', async function() {
      req = {
        user: {
          id: 1,
        },
        params: {
          groupId: 'test',
        },
      };

      await expect(getMembersOfGroupController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(next);
      assert.notCalled(res.send);
      assert.notCalled(findAllForGroup);
    });
  });

  it('sends members', async function() {
    req = {
      user: {
        id: 1,
      },
      params: {
        groupId: '13',
      },
    };

    const members = [
      {
        isAdmin: true,
        userId: 1,
      },
      {
        isAdmin: false,
        userId: 2,
      },
    ];

    findAllForGroup.resolves(members as any);

    await expect(getMembersOfGroupController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(findAllForGroup, req.user, 13);
    assert.calledOnceWithExactly(res.send, match({members}));

    assert.notCalled(next);
  });
});
