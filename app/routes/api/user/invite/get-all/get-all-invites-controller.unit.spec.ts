/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {InviteRepository} from '../../../../../models/invite/invite-repository';
import {getAllInvitesController} from './get-all-invites-controller';
import {NotLoggedInError} from '../../../../../errors';

describe('GetAllInvitesController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  it('calls InviteRepository with correct parameters ' +
  'and sends response', function(done) {
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

    const inviteRepFindAllForUserStub = sinon.stub(InviteRepository,
        'findAllForUser').resolves(invites as any);

    res = {};
    res.send = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(
          inviteRepFindAllForUserStub,
          req.user,
          match({
            withGroupData: true,
            withInvitedByData: true,
          }),
      );

      assert.calledOnceWithExactly(res.send, match({
        invites,
      }));
      done();
    });

    getAllInvitesController(req, res, next);
  });

  it('forwards error to next if InviteRepository throws one', function(done) {
    req = {
      user: {
        id: 4,
      },
    };

    const error = new Error('TEST');

    const inviteRepFindAllForUserStub = sinon.stub(InviteRepository,
        'findAllForUser').rejects(error);

    res = {};
    res.send = sinon.stub();
    next = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(
          inviteRepFindAllForUserStub,
          req.user,
          match({
            withGroupData: true,
            withInvitedByData: true,
          }),
      );

      assert.calledOnceWithExactly(next, error);
      assert.notCalled(res.send);
      done();
    });

    getAllInvitesController(req, res, next);
  });

  it('calls next with NotLoggedInError if user ' +
  'is missing on request', function(done) {
    req = {};
    res = {};
    res.send = sinon.stub();
    next = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(next, match.instanceOf(NotLoggedInError));
      assert.notCalled(res.send);
      done();
    });

    getAllInvitesController(req, res, next);
  });
});
