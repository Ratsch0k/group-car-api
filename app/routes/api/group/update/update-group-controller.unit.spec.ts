import sinon, {match} from 'sinon';
import {Membership, Group} from '../../../../models';
import {expect} from 'chai';
import {updateGroupRequestChecker, updateGroupRequestHandler} from './update-group-controller';
import {BadRequestError, NotMemberOfGroupError, NotAdminOfGroupError, GroupNotFoundError} from '@app/errors';
import Bluebird from 'bluebird';
import groupRouter from '../group-router';
import { doesNotMatch } from 'assert';

const sandbox = sinon.createSandbox();

describe('UpdateGroup', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sandbox.restore();
  });

  describe('RequestChecker', function() {
    describe('throws', function() {
      it('BadRequestError if userId is missing', function() {
        req = {
          params: {
            groupId: 12
          },
          user: {},
        };

        expect(() => updateGroupRequestChecker(req, res, next)).to.throw(BadRequestError);
      });

      it('BadRequestError if groupId is missing from params', function() {
        req = {
          user: {
            id: 3
          },
          params: {},
        };

        expect(() => updateGroupRequestChecker(req, res, next)).to.throw(BadRequestError);
      });



      it('NotMemberOfGroupError if Membership for user and ' +
        'group doesn\'t exist', function(done) {
          req = {
            params: {
              groupId: 10
            },
            user: {
              id: 10,
            },
          };

          // Stub Membership.findOne
          const membershipFindOneStub: any = sandbox.stub(Membership, 'findOne');
          membershipFindOneStub.usingPromise(Bluebird).resolves(null as any);

          // Stub next function
          next = sandbox.stub().callsFake(() => {
            sandbox.assert.calledOnceWithExactly(
              membershipFindOneStub,
              match({
                where: {
                  userId: req.user.id,
                  groupId: req.params.groupId
                }
              }),
            );
            sandbox.assert.calledOnceWithExactly(
              next,
              match.instanceOf(NotMemberOfGroupError)); 
            done();
          });

          updateGroupRequestChecker(req, res, next);
      });

      it('NotAdminOfGroupError if Membership indicates that user ' +
          'is not an admin of the group', function(done) {
            req = {
              params: {
                groupId: 10
              },
              user: {
                id: 10,
              },
            };
  
            // Stub Membership.findOne
            const membership = {
              isAdmin: false,
            };
            const membershipFindOneStub: any = sandbox.stub(Membership, 'findOne');
            membershipFindOneStub.usingPromise(Bluebird).resolves(membership as any);
  
            // Stub next function
            next = sandbox.stub().callsFake(() => {
              sandbox.assert.calledOnceWithExactly(
                membershipFindOneStub,
                match({
                  where: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                  }
                }),
              );
              sandbox.assert.calledOnceWithExactly(next,
                match.instanceOf(NotAdminOfGroupError)); 
                done();
            });

            updateGroupRequestChecker(req, res, next);
      });

      it('GroupNotFoundError if user is admin of group ' +
          'but group doesn\'t exist', function(done) {
            req = {
              params: {
                groupId: 10
              },
              user: {
                id: 10,
              },
            };
  
            // Stub Membership.findOne
            const membership = {
              isAdmin: true,
            };
            const membershipFindOneStub: any = sandbox.stub(Membership, 'findOne');
            membershipFindOneStub.usingPromise(Bluebird).resolves(membership as any);

            // Stub Group.findByPk
            const groupFindByPk: any = sandbox.stub(Group, 'findByPk');
            groupFindByPk.usingPromise(Bluebird).resolves(null as any);
  
            // Stub next function
            next = sandbox.stub().callsFake(() => {
              sandbox.assert.calledOnceWithExactly(
                membershipFindOneStub,
                match({
                  where: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                  }
                }),
              );
              sandbox.assert.calledOnceWithExactly(groupFindByPk,
                req.params.groupId);
              sandbox.assert.calledOnceWithExactly(next,
                match.instanceOf(GroupNotFoundError)); 
              done();
            });

            updateGroupRequestChecker(req, res, next);
      });

      it('Error if Membership.findOne throws one', function(done) {
        req = {
          params: {
            groupId: 10
          },
          user: {
            id: 10,
          },
        };

        // Stub Membership.findOne
        const error = new Error('TEST');
        const membershipFindOneStub: any = sandbox.stub(Membership, 'findOne');
        membershipFindOneStub.usingPromise(Bluebird).rejects(error);

        // Stub next function
        next = sandbox.stub().callsFake(() => {
          sandbox.assert.calledOnceWithExactly(
            membershipFindOneStub,
            match({
              where: {
                userId: req.user.id,
                groupId: req.params.groupId
              }
            }),
          );
          sandbox.assert.calledOnceWithExactly(next,
            error); 
          done();
        });

        updateGroupRequestChecker(req, res, next);
      });

      it('Error if Group.findByPk throw one', function(done) {
        req = {
          params: {
            groupId: 10
          },
          user: {
            id: 10,
          },
        };

        // Stub Membership.findOne
        const membership = {
          isAdmin: true,
        };
        const membershipFindOneStub: any = sandbox.stub(Membership, 'findOne');
        membershipFindOneStub.usingPromise(Bluebird).resolves(membership as any);

        // Stub Group.findByPk
        const error = new Error('TEST');
        const groupFindByPk: any = sandbox.stub(Group, 'findByPk');
        groupFindByPk.usingPromise(Bluebird).rejects(error);

        // Stub next function
        next = sandbox.stub().callsFake(() => {
          sandbox.assert.calledOnceWithExactly(
            membershipFindOneStub,
            match({
              where: {
                userId: req.user.id,
                groupId: req.params.groupId
              }
            }),
          );
          sandbox.assert.calledOnceWithExactly(groupFindByPk,
            req.params.groupId);
          sandbox.assert.calledOnceWithExactly(next, error); 
          done();
        });

        updateGroupRequestChecker(req, res, next);
      });
    });

    it('calls next if user is admin of group and group exists', function(done) {
      req = {
        params: {
          groupId: 10
        },
        user: {
          id: 10,
        },
      };

      // Stub Membership.findOne
      const membership = {
        isAdmin: true,
      };
      const membershipFindOneStub: any = sandbox.stub(Membership, 'findOne');
      membershipFindOneStub.usingPromise(Bluebird).resolves(membership as any);

      // Stub Group.findByPk
      const group = true;
      const groupFindByPk: any = sandbox.stub(Group, 'findByPk');
      groupFindByPk.usingPromise(Bluebird).resolves(group as any);

      // Stub next function
      next = sandbox.stub().callsFake(() => {
        sandbox.assert.calledOnceWithExactly(
          membershipFindOneStub,
          match({
            where: {
              userId: req.user.id,
              groupId: req.params.groupId
            }
          }),
        );
        sandbox.assert.calledOnceWithExactly(groupFindByPk,
          req.params.groupId);
        sandbox.assert.calledOnceWithExactly(next);
        done();
      });

      updateGroupRequestChecker(req, res, next);
    });
  });

  describe('RequestHandler', function() {
    it('only updates certain fields and sends updated group', function(done) {
      // Create request
      req = {
        body: {
          name: 'NEW NAME',
          descriptions: 'NEW DESC',
          ownerId: 100
        },
        params: {
          groupId: 2,
        },
      };
      
      // Stub Group.update
      const returnValue = [1, ['group', 'no group']];
      const groupUpdateStub: any = sandbox.stub(Group, 'update');
      groupUpdateStub.usingPromise(Bluebird).resolves(returnValue as any);

      // Stub res
      res = {};
      res.send = sandbox.stub().callsFake(() => {
        sandbox.assert.calledOnceWithExactly(groupUpdateStub, match({
            name: req.body.name,
            description: req.body.description,
          }),
          match({
            where: {
              id: req.params.groupId,
            },
            returning: true,
          },
        ));
        sandbox.assert.calledOnceWithExactly(res.send, 'group');
        done();
      });

      updateGroupRequestHandler(req, res, next);
    });

    it('calls next with error if Group.update throws an error', function(done) {
      // Create request
      req = {
        body: {
          name: 'NEW NAME',
          descriptions: 'NEW DESC',
          ownerId: 100
        },
        params: {
          groupId: 2,
        },
      };
      
      // Stub Group.update
      const error = new Error('TEST');
      const groupUpdateStub: any = sandbox.stub(Group, 'update');
      groupUpdateStub.usingPromise(Bluebird).rejects(error);

      // Stub next
      next = sandbox.stub().callsFake(() => {
        sandbox.assert.calledOnceWithExactly(groupUpdateStub, match({
            name: req.body.name,
            description: req.body.description,
          }),
          match({
            where: {
              id: req.params.groupId,
            },
            returning: true,
          },
        ));
        sandbox.assert.calledOnceWithExactly(next, error);
        done();
      });

      updateGroupRequestHandler(req, res, next);
    });
  });
});
