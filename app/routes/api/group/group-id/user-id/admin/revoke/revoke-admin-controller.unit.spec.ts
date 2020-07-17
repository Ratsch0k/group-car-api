import {expect} from 'chai';
import {revokeAdminController} from './revoke-admin-controller';
import sinon, {assert, match} from 'sinon';
import {BadRequestError} from '../../../../../../../errors';
import {MembershipService} from '../../../../../../../models';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('RevokeAdminController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequest if', function() {
    it('currentUser undefined', function() {
      req = {
        params: {
          groupId: 1,
          userId: 1,
        },
      };

      return expect(revokeAdminController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);
    });

    it('groupId not parsable', function() {
      req = {
        user: {
          id: 6,
        },
        params: {
          groupId: 'test',
          userId: 1,
        },
      };

      return expect(revokeAdminController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);
    });

    it('userId not parsable', function() {
      req = {
        user: {
          id: 6,
        },
        params: {
          groupId: 1,
          userId: 'test',
        },
      };

      return expect(revokeAdminController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);
    });
  });

  it('calls MembershipService.changeAdminPermission with ' +
  'correct parameters', async function() {
    req = {
      user: {
        id: 6,
      },
      params: {
        groupId: 1,
        userId: 6,
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };

    const serviceStub = sinon.stub(
        MembershipService,
        'changeAdminPermission',
    ).resolves();

    await expect(revokeAdminController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        serviceStub,
        req.user,
        match(req.params),
        false,
    );

    assert.calledOnceWithExactly(res.status, 204);
    assert.calledOnceWithExactly(res.send);
  });
});
