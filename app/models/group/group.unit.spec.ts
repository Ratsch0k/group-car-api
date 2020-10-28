/* eslint-disable @typescript-eslint/no-explicit-any */
import {createMembershipForOwner, Membership} from '../index';
import sinon, {match} from 'sinon';
import Bluebird from 'bluebird';
import {expect} from 'chai';
import {InternalError} from '../../errors';

const sandbox = sinon.createSandbox();

describe('Group', function() {
  afterEach(function() {
    sandbox.restore();
  });

  describe('afterCreate hook', function() {
    it('creates a membership with admin permissions', function() {
      const fakeGroup = {
        id: 1,
        name: 'Group',
        description: 'Description',
        ownerId: 23,
      };

      const expectedMembership = {
        groupId: fakeGroup.id,
        userId: fakeGroup.ownerId,
        isAdmin: true,
      };

      // Stub membership
      const createMembershipStub: any = sandbox.stub(Membership, 'create');
      createMembershipStub.usingPromise(Bluebird).resolves();

      return createMembershipForOwner(fakeGroup as any).then(() => {
        sandbox.assert.calledOnce(createMembershipStub);
        sandbox.assert.calledWith(
            createMembershipStub,
            match(expectedMembership),
        );
      });
    });

    it('throws InternalError if Membership can\' be created', function(done) {
      const fakeGroup = {
        id: 1,
        name: 'Group',
        description: 'Description',
        ownerId: 23,
      };

      const expectedMembership = {
        groupId: fakeGroup.id,
        userId: fakeGroup.ownerId,
        isAdmin: true,
      };

      // Stub membership
      const createMembershipStub = sandbox.stub(Membership, 'create');
      createMembershipStub.usingPromise(Bluebird).rejects(new Error('TEST'));

      createMembershipForOwner(fakeGroup as any).catch((err) => {
        sandbox.assert.calledOnce(createMembershipStub);
        sandbox.assert.calledWith(
            createMembershipStub as any,
            match(expectedMembership),
        );
        expect(err).to.be.instanceOf(InternalError);
        done();
      });
    });
  });
});
