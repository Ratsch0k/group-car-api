/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert} from 'sinon';
import {getGroupController} from './get-group-controller';
import {
  BadRequestError,
} from '../../../../../errors';
import {GroupService} from '../../../../../models';

describe('GetGroupController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  it('throws BadRequestError if either groupId or ' +
      'userId is missing', function() {
    // Test none is provided
    req = {
      user: {},
      params: {},
    };

    expect(getGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    // Test groupId is missing
    req = {
      user: {
        id: 4,
      },
      params: {},
    };

    expect(getGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    // Test userId is missing
    req = {
      user: {},
      params: {
        groupId: 3,
      },
    };

    expect(getGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);
  });

  it('sends return value of GroupService.findById', async function() {
    const group = {
      name: 'TEST',
    };
    const findById = sinon.stub(GroupService, 'findById')
        .resolves(group as any);

    res = {
      send: sinon.stub(),
    };

    req = {
      user: {
        id: 5,
      },
      params: {
        groupId: 15,
      },
    };

    await expect(getGroupController(req, res, next)).to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(findById, req.user, req.params.groupId);
    assert.calledOnceWithExactly(res.send, group);
  });
});
