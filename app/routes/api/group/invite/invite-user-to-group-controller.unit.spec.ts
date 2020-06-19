import {expect} from 'chai';
import {checkInviteToLoggedInUser} from './invite-user-to-group-controller';
import sinon, { match } from 'sinon';
import {BadRequestError} from '../../../../errors';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('InviteUserToGroup', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  describe('checkInviteToLoggedInUser', function() {
    it('throws BadRequestError if user tries to ' +
        'send an invite to himself/herself', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 10,
        },
      };

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(BadRequestError));
        done();
      });

      checkInviteToLoggedInUser(req, res, next);
    });

    it('calls next if user tries to send ' +
        'invite to other player', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
      };

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next);
        done();
      });

      checkInviteToLoggedInUser(req, res, next);
    });
  });

  describe('checkMembership', function() {

  });

  describe('checkGroup', function() {

  });

  describe('checkUser', function() {

  });

  describe('checkAlreadyInvited', function() {

  });

  describe('checkAlreadyMember', function() {

  });

  describe('inviteUser', function() {

  });
});
