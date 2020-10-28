/* eslint-disable @typescript-eslint/no-explicit-any */
import {Group} from '../../../../models';
import sinon, {match} from 'sinon';
import createGroupController from './create-group-controller';
import Bluebird from 'bluebird';
import {expect} from 'chai';

const sandbox = sinon.createSandbox();

describe('CreateGroupController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sandbox.restore();
  });

  it('creates group and responses with group data and 201', function(done) {
    // Create fake user object
    const user = {
      id: 77,
    };

    // Create body object
    const body = {
      name: 'TEST GROUP',
      description: 'TEST DESC',
    };

    const group = {
      name: body.name,
      description: body.description,
      ownerId: user.id,
    };

    // Stub create group method
    const createGroupStub = sandbox.stub(Group, 'create');
    createGroupStub.usingPromise(Bluebird).resolves(group as any);

    // Create fake request
    req = {
      body,
      user,
    };

    next = sandbox.stub();

    res = {};
    res.status = sandbox.stub().returns(res);
    res.send = sandbox.stub().callsFake((data) => {
      sandbox.assert.calledOnceWithExactly(
        createGroupStub as any,
        match(group),
      );
      sandbox.assert.calledOnceWithExactly(res.status, 201);
      sandbox.assert.calledOnce(res.send);
      sandbox.assert.notCalled(next);

      expect(data).to.eql(group);
      done();
    });

    createGroupController(req, res, next);
  });

  it('calls next on error', function(done) {
    // Create fake user object
    const user = {
      id: 77,
    };

    // Create body object
    const body = {
      name: 'TEST GROUP',
      description: 'TEST DESC',
    };

    const group = {
      name: body.name,
      description: body.description,
      ownerId: user.id,
    };

    // Stub create group method
    const createGroupStub = sandbox.stub(Group, 'create');
    const fakeError = new Error('TEST');
    createGroupStub.usingPromise(Bluebird).rejects(fakeError);

    // Create fake request
    req = {
      body,
      user,
    };

    res = {};
    res.status = sandbox.stub();
    res.send = sandbox.stub();

    next = sandbox.stub().callsFake((error) => {
      sandbox.assert.calledOnceWithExactly(
            createGroupStub as any,
            match(group),
      );
      sandbox.assert.notCalled(res.status);
      sandbox.assert.notCalled(res.send);

      sandbox.assert.calledOnce(next);

      expect(error).to.equal(fakeError);
      done();
    });

    createGroupController(req, res, next);
  });

  it('only uses certain sent attribute', function(done) {
    // Create fake user object
    const user = {
      id: 77,
      otherUser: 'should not be used',
    };

    // Create body object
    const body = {
      name: 'TEST GROUP',
      description: 'TEST DESC',
      otherGroup: 'should not be used',
    };

    const group = {
      name: body.name,
      description: body.description,
      ownerId: user.id,
    };

    // Stub create group method
    const createGroupStub = sandbox.stub(Group, 'create');
    createGroupStub.usingPromise(Bluebird).resolves(group as any);

    // Create fake request
    req = {
      body,
      user,
    };

    next = sandbox.stub();

    res = {};
    res.status = sandbox.stub().returns(res);
    res.send = sandbox.stub().callsFake((data) => {
      sandbox.assert.calledOnceWithExactly(
        createGroupStub as any,
        match(group),
      );
      sandbox.assert.calledOnceWithExactly(res.status, 201);
      sandbox.assert.calledOnce(res.send);
      sandbox.assert.notCalled(next);

      expect(data).to.eql(group);
      expect(data).to.not.have.any.keys('someOther', 'otherGroup');
      done();
    });

    createGroupController(req, res, next);
  });
});
