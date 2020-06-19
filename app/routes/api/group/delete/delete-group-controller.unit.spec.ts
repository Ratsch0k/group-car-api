/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import deleteGroupController from './delete-group-controller';
import {expect} from 'chai';
import {
  BadRequestError,
  NotMemberOfGroupError,
  GroupNotFoundError,
  NotOwnerOfGroupError,
} from '../../../../errors';
import {Membership, Group} from '../../../../models';
import Bluebird from 'bluebird';
import sequelize from '../../../../db';

describe('DeleteGroupController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('userId and groupId is missing', function() {
      req = {
        user: {},
        params: {},
      };

      expect(() => deleteGroupController(req, res, next))
          .to.throw(BadRequestError);
    });

    it('userId is missing', function() {
      req = {
        user: {},
        params: {
          groupId: 7,
        },
      };

      expect(() => deleteGroupController(req, res, next))
          .to.throw(BadRequestError);
    });
    it('groupId is missing', function() {
      req = {
        user: {
          id: 6,
        },
        params: {},
      };

      expect(() => deleteGroupController(req, res, next))
          .to.throw(BadRequestError);
    });
  });

  it('calls next with NotMemberOfGroupError if no memberships exists for ' +
      'user and group', function(done) {
    req = {
      user: {
        id: 6,
      },
      params: {
        groupId: 7,
      },
    };

    const findOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(null as any);

    next = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(findOneStub,
          match({where:
            {
              groupId: req.params.groupId,
              userId: req.user.id,
            },
          }));

      assert.calledOnceWithExactly(next, match
          .instanceOf(NotMemberOfGroupError));
      done();
    });

    deleteGroupController(req, res, next);
  });

  it('calls next with GroupNotFoundError if membership for ' +
      'user and group exists but group doesn\'t', function(done) {
    req = {
      user: {
        id: 6,
      },
      params: {
        groupId: 7,
      },
    };

    const membership = {};

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(membership as any);

    const groupFindByPkStub: any = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(null as any);

    next = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(membershipFindOneStub,
          match({where:
                {
                  groupId: req.params.groupId,
                  userId: req.user.id,
                },
          }));
      assert.calledOnceWithExactly(groupFindByPkStub, req.params.groupId);
      assert.calledOnceWithExactly(next, match.instanceOf(GroupNotFoundError));
      done();
    });

    deleteGroupController(req, res, next);
  });

  it('calls next with NotOwnerOfGroup if user is member ' +
      'of group but not the owner', function(done) {
    req = {
      user: {
        id: 6,
      },
      params: {
        groupId: 7,
      },
    };

    const membership = {};

    const group = {
      ownerId: req.user.id + 1,
    };

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(membership as any);

    const groupFindByPkStub: any = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(group as any);

    next = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(membershipFindOneStub,
          match({where:
                    {
                      groupId: req.params.groupId,
                      userId: req.user.id,
                    },
          }));
      assert.calledOnceWithExactly(groupFindByPkStub, req.params.groupId);
      assert.calledOnceWithExactly(next, match
          .instanceOf(NotOwnerOfGroupError));
      done();
    });

    deleteGroupController(req, res, next);
  });

  it('deletes all memberships of the group and the group itself in ' +
      'a transaction if user is owner of group and ' +
      'responses with 204', function(done) {
    req = {
      user: {
        id: 6,
      },
      params: {
        groupId: 7,
      },
    };

    const membership = {};

    const group = {
      ownerId: req.user.id,
      destroy: sinon.stub().usingPromise(Bluebird).resolves(),
    };

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(membership as any);

    const groupFindByPkStub: any = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(group as any);

    res = {};
    res.status = sinon.stub().returnsThis();
    res.send = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(membershipFindOneStub,
          match({where:
                        {
                          groupId: req.params.groupId,
                          userId: req.user.id,
                        },
          }));
      assert.calledOnceWithExactly(groupFindByPkStub, req.params.groupId);
      assert.calledOnceWithExactly(group.destroy);
      assert.calledOnceWithExactly(res.status, 204);
      assert.calledOnceWithExactly(res.send);
      done();
    });

    deleteGroupController(req, res, next);
  });

  it('calls next with any error which is thrown while deleting ' +
      'the group', function(done) {
    req = {
      user: {
        id: 6,
      },
      params: {
        groupId: 7,
      },
    };

    const membership = {};

    const testError = new Error('TEST');
    const group = {
      ownerId: req.user.id,
      destroy: sinon.stub().usingPromise(Bluebird).rejects(testError),
    };

    const membershipFindOneStub = sinon.stub(Membership, 'findOne')
        .usingPromise(Bluebird).resolves(membership as any);

    const groupFindByPkStub: any = sinon.stub(Group, 'findByPk')
        .usingPromise(Bluebird).resolves(group as any);

    res = {};
    res.status = sinon.stub().returnsThis();
    res.send = sinon.stub();
    next = sinon.stub().callsFake(() => {
      assert.calledOnceWithExactly(membershipFindOneStub,
          match({where:
                        {
                          groupId: req.params.groupId,
                          userId: req.user.id,
                        },
          }));
      assert.calledOnceWithExactly(groupFindByPkStub, req.params.groupId);
      assert.calledOnceWithExactly(group.destroy);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
      assert.calledOnceWithExactly(next, testError);
      done();
    });

    deleteGroupController(req, res, next);
  });
});
