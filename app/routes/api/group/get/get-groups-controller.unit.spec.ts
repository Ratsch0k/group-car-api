/* eslint-disable @typescript-eslint/no-explicit-any */
import {GroupService} from '../../../../models';
import sinon, {assert, match} from 'sinon';
import {expect} from 'chai';
import {getGroupsController} from './get-groups-controller';
import {BadRequestError} from '../../../../errors';

describe('getGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let groupFindForUser: sinon.SinonStub<any, any>;

  beforeEach(function() {
    groupFindForUser = sinon.stub(GroupService, 'findAllForUser');
    res = {
      send: sinon.stub(),
    };
    next = sinon.stub();
  });

  afterEach(function() {
    sinon.restore();
  });

  it('throws BadRequestError if user on request ' +
  'is not an object', async function() {
    req = {};

    await expect(getGroupsController(req, res, next))
        .to.be.eventually.rejectedWith(BadRequestError);

    assert.notCalled(groupFindForUser);
    assert.notCalled(next);
    assert.notCalled(res.send);
  });

  it('sends all groups', async function() {
    req = {
      user: {
        id: 8,
      },
    };

    const groups = [
      {
        id: 1,
        name: 'group_1',
      },
      {
        id: 2,
        name: 'group_2',
      },
    ];

    groupFindForUser.resolves(groups as any);

    await expect(getGroupsController(req, res, next))
        .to.be.eventually.fulfilled;


    assert.calledOnceWithExactly(groupFindForUser, req.user);
    assert.calledOnceWithExactly(res.send, match({groups}));
    assert.notCalled(next);
  });
});
