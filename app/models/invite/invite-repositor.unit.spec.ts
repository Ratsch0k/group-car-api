/* eslint-disable @typescript-eslint/no-explicit-any */
import {Membership} from '../membership';
import sinon, {match} from 'sinon';
import {InviteRepository} from './invite-repository';
import {UnauthorizedError} from '../../errors';
import {expect} from 'chai';

describe('InviteRepository', function() {
  describe('findById', function() {
    it('throws UnauthorizedError if current user ' +
    'not user of invite and not member of group', async function() {
      const membershipFindAllStub = sinon.stub(Membership, 'findAll')
          .resolves([] as any);

      const currentUser = {
        id: 2,
      };

      await InviteRepository
          .findById(currentUser as any, {userId: 3, groupId: 1})
          .catch((err) => {
            expect(err).to.be.instanceOf(UnauthorizedError);
          });

      sinon.assert.calledOnceWithExactly(membershipFindAllStub, match({
        where: {
          userId: currentUser.id,
        },
      }));
    });
  });

  describe('findAllForUser', function() {

  });
});
