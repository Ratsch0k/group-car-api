/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon from 'sinon';
import {UserService} from './user-service';
import {MembershipRepository} from '../membership';

describe('UserService', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('leaveGroup', function() {
    it('calls and returns result of ' +
    'MembershipRepository.removeUserFromGroup', async function() {
      const currentUser: any = {
        id: 4,
      };

      const groupId = 15;

      const removeStub = sinon.stub(MembershipRepository, 'removeUserFromGroup')
          .resolves(groupId as any);

      await expect(UserService.leaveGroup(currentUser, groupId))
          .to.eventually.eql(groupId);

      sinon.assert.calledOnceWithExactly(removeStub, currentUser.id, groupId);
    });
  });
});
