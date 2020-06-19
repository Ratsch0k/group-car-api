/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {match} from 'sinon';
import {getGroupController} from './get-group-controller';
import {
  BadRequestError,
  UnauthorizedError,
  GroupNotFoundError,
} from '../../../../errors';
import {Membership, Group, Invite, User} from '../../../../models';
import Bluebird from 'bluebird';

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

    expect(() => getGroupController(req, res, next)).to.throw(BadRequestError);

    // Test groupId is missing
    req = {
      user: {
        id: 4,
      },
      params: {},
    };

    expect(() => getGroupController(req, res, next)).to.throw(BadRequestError);

    // Test userId is missing
    req = {
      user: {},
      params: {
        groupId: 3,
      },
    };

    expect(() => getGroupController(req, res, next)).to.throw(BadRequestError);
  });

  it('calls next with UnauthorizedError if user is not a member of ' +
      'the group and has no invite for it', function(done) {
    req = {
      user: {
        id: 8,
      },
      params: {
        groupId: 10,
      },
    };

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(null as any);

    const groupFindByPkStub = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(null as any);

    const inviteFindOneStub = sinon.stub(Invite, 'findOne')
        .usingPromise(Bluebird).resolves(null as any);

    next = sinon.stub().callsFake(() => {
      sinon.assert.calledOnceWithExactly(membershipFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        }}));
      sinon.assert.calledOnceWithExactly(
        groupFindByPkStub as any, req.params.groupId);
      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        },
      }));
      sinon.assert.calledOnceWithExactly(next,
          match.instanceOf(UnauthorizedError));
      done();
    });

    getGroupController(req, res, next);
  });

  it('calls next with GroupNotFoundError if user is either ' +
      'a member or has an invite but the group doesn\'t exist', function(done) {
    req = {
      user: {
        id: 8,
      },
      params: {
        groupId: 10,
      },
    };

    const invite = {
      userId: req.user.id,
      createAt: new Date(),
      groupId: req.params.groupId,
    };

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(null as any);

    const groupFindByPkStub = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(null as any);

    const inviteFindOneStub = sinon.stub(Invite, 'findOne')
        .usingPromise(Bluebird).resolves(invite as any);

    next = sinon.stub().callsFake(() => {
      sinon.assert.calledOnceWithExactly(membershipFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        }}));
      sinon.assert.calledOnceWithExactly(
    groupFindByPkStub as any, req.params.groupId);
      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        },
      }));
      sinon.assert.calledOnceWithExactly(next,
          match.instanceOf(GroupNotFoundError));
      done();
    });

    getGroupController(req, res, next);
  });

  it('sends a simple version of the group if the user ' +
      'has an invite for it but is not a member', function(done) {
    req = {
      user: {
        id: 8,
      },
      params: {
        groupId: 10,
      },
    };

    res = {};

    next = sinon.stub();

    const invite = {
      userId: req.user.id,
      createAt: new Date(),
      groupId: req.params.groupId,
    };

    const group = {
      id: 10,
      name: 'NAME',
      description: 'DESC',
      ownerId: 1,
      get: sinon.stub().returnsThis(),
    };

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(null as any);

    const groupFindByPkStub = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(group as any);

    const inviteFindOneStub = sinon.stub(Invite, 'findOne')
        .usingPromise(Bluebird).resolves(invite as any);

    res.send = sinon.stub().callsFake((data) => {
      sinon.assert.calledOnceWithExactly(membershipFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        }}));
      sinon.assert.calledOnceWithExactly(
      groupFindByPkStub as any, req.params.groupId);
      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        },
      }));
      sinon.assert.notCalled(next);

      expect(data).to.include({
        id: group.id,
        name: group.name,
        ownerId: group.ownerId,
        description: group.description,
      });

      expect(data).to.not.have.property('createdAt');
      expect(data).to.not.have.property('updatedAt');

      done();
    });

    getGroupController(req, res, next);
  });

  it('returns the complete group with a list of all members ' +
      'if the user is a member of the group', function(done) {
    req = {
      user: {
        id: 8,
      },
      params: {
        groupId: 10,
      },
    };

    res = {};

    next = sinon.stub();

    const invite = {
      userId: req.user.id,
      createAt: new Date(),
      groupId: req.params.groupId,
    };

    const group = {
      id: 10,
      name: 'NAME',
      description: 'DESC',
      ownerId: 1,
      get: sinon.stub().returnsThis(),
    };

    const userMembership = {
      groupId: req.params.groupId,
      userId: req.user.id,
      isAdmin: true,
    };

    const allGroupMembers = [
      {
        userId: req.user.id,
        isAdmin: true,
        User: {
          username: 'TEST',
          email: 'TEST@mail.com',
        },
      },
      {
        userId: req.user.id + 1,
        isAdmin: true,
        User: {
          username: 'TEST1',
          email: 'TEST1@mail.com',
        },
      },
      {
        userId: req.user.id + 2,
        isAdmin: false,
        User: {
          username: 'TEST2',
          email: 'TEST2@mail.com',
        },
      },
    ];

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(userMembership as any);

    const membershipFindAllStub = sinon.stub(Membership, 'findAll')
        .usingPromise(Bluebird).resolves(allGroupMembers as any);

    const groupFindByPkStub = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(group as any);

    const inviteFindOneStub = sinon.stub(Invite, 'findOne')
        .usingPromise(Bluebird).resolves(invite as any);

    res.send = sinon.stub().callsFake((data) => {
      sinon.assert.calledOnceWithExactly(membershipFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        }}));
      sinon.assert.calledOnceWithExactly(
          groupFindByPkStub as any, req.params.groupId);
      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          groupId: req.params.groupId,
          userId: req.user.id,
        },
      }));
      sinon.assert.notCalled(next);

      sinon.assert.calledOnceWithExactly(membershipFindAllStub, match({
        where: {
          groupId: req.params.groupId,
        },
        attributes: [
          'userId',
          'isAdmin',
        ],
        include: [
          {
            model: User,
            as: 'User',
            attributes: [
              'username',
              'email',
            ],
          },
        ],
      }));

      expect(data).to.include({
        id: group.id,
        name: group.name,
        ownerId: group.ownerId,
        description: group.description,
        members: allGroupMembers,
      });

      done();
    });

    getGroupController(req, res, next);
  });
});
