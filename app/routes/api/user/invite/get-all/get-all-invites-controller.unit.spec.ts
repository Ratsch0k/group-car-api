/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {getAllInvitesController} from './get-all-invites-controller';
import {NotLoggedInError} from '../../../../../errors';
import {InviteService} from '../../../../../models';
import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('GetAllInvitesController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  it('calls InviteRepository with correct parameters ' +
  'and sends response', async function() {
    req = {
      user: {
        id: 4,
      },
    };

    const invites = [
      {
        userId: req.user.id,
        groupId: 1,
      },
      {
        userId: req.user.id,
        groupId: 2,
      },
      {
        userId: req.user.id,
        groupId: 3,
      },
    ];

    const inviteServiceFindAllForUserStub = sinon.stub(InviteService,
        'findAllForUser').resolves(invites as any);

    res = {};
    res.send = sinon.stub();

    await getAllInvitesController(req, res, next);

    assert.calledOnceWithExactly(
        inviteServiceFindAllForUserStub,
        req.user,
        req.user.id,
    );

    assert.calledOnceWithExactly(res.send, match({
      invites,
    }));
  });

  it('forwards error to next if InviteRepository ' +
  'throws one', function() {
    req = {
      user: {
        id: 4,
      },
    };

    const error = new Error('TEST');

    const inviteServiceFindAllForUserStub = sinon.stub(InviteService,
        'findAllForUser').rejects(error);

    res = {};
    res.send = sinon.stub();
    next = sinon.stub();

    expect(getAllInvitesController(req, res, next))
        .to.eventually.be.rejectedWith(error);

    assert.calledOnceWithExactly(
        inviteServiceFindAllForUserStub,
        req.user,
        req.user.id,
    );

    assert.notCalled(res.send);
  });

  it('calls next with NotLoggedInError if user ' +
  'is missing on request', function() {
    req = {};
    res = {};
    res.send = sinon.stub();
    next = sinon.stub();

    expect(getAllInvitesController(req, res, next))
        .to.eventually.be.rejectedWith(NotLoggedInError);
  });
});
