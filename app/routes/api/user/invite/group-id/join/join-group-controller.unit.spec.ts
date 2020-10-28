/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {BadRequestError} from '../../../../../../errors';
import {joinGroupController} from './join-group-controller';
import sinon, {assert} from 'sinon';
import {InviteService} from '../../../../../../models';

describe('JoinGroupController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  it('throws BadRequestError if user not defined on request', async function() {
    req = {
      params: {
        groupId: '51',
      },
    };

    const inviteAssignUserStub = sinon.stub(InviteService, 'assignUserToGroup');

    await expect(joinGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    assert.notCalled(inviteAssignUserStub);
  });

  it('throws BadRequestError if groupId ' +
  'can\'t be parsed into an integer', async function() {
    req = {
      user: {
        id: 12,
      },
      params: {
        groupId: 'ste',
      },
    };

    const inviteAssignUserStub = sinon.stub(InviteService, 'assignUserToGroup');

    await expect(joinGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    assert.notCalled(inviteAssignUserStub);
  });

  it('calls assignUserToGroup and calls ' +
  'send with status 204', async function() {
    req = {
      user: {
        id: 12,
      },
      params: {
        groupId: 71,
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };

    const inviteAssignUserStub = sinon.stub(InviteService, 'assignUserToGroup')
        .resolves();

    await expect(joinGroupController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        inviteAssignUserStub,
        req.user,
        req.params.groupId,
    );

    assert.calledOnceWithExactly(res.status, 204);
    assert.calledOnceWithExactly(res.send);
  });
});
