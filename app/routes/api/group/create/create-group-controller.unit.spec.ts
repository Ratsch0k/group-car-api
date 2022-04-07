/* eslint-disable @typescript-eslint/no-explicit-any */
import {GroupService} from '../../../../models';
import sinon, {match} from 'sinon';
import createGroupController from './create-group-controller';
import {expect} from 'chai';
import {BadRequestError} from '../../../../errors';

describe('CreateGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let createGroupStub: sinon.SinonStub;

  beforeEach(function() {
    createGroupStub = sinon.stub(GroupService, 'create');
  });

  afterEach(function() {
    sinon.restore();
  });

  it('creates group and responses with group data and 201', async function() {
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
    createGroupStub.resolves(group as any);

    // Create fake request
    req = {
      body,
      user,
    };

    next = sinon.stub();

    res = {};
    res.status = sinon.stub().returns(res);
    res.send = sinon.stub();

    await createGroupController(req, res, next);

    sinon.assert.calledOnceWithExactly(
        createGroupStub,
        user,
        match({
          name: group.name,
          description: group.description,
        }),
    );
    sinon.assert.calledOnceWithExactly(res.status, 201);
    sinon.assert.calledOnce(res.send);
    sinon.assert.notCalled(next);
    sinon.assert.calledOnceWithExactly(res.send, group);
  });

  it('throws BadRequestError if request data is wrong', async function() {
    // Create mocks
    res = {};
    res.status = sinon.stub();
    res.send = sinon.stub();
    next = sinon.stub();

    const user = {
      id: 77,
    };

    /*
     * Test if error when name is missing
     */
    const nameMissing = {
      description: 'TEST DESC',
    };

    req = {
      body: nameMissing,
      user,
    };

    await expect(createGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    /*
     * Test if error when description is defined but not a string
     */
    const descriptionWrong = {
      name: 'GROUP_NAME',
      description: 1,
    };

    req = {
      body: descriptionWrong,
      user,
    };

    await expect(createGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    /*
     * Test if error when user is missing
     */
    const correctBody = {
      name: 'GROUP_NAME',
      description: 'GORUP_DESC',
    };
    req = {
      body: correctBody,
    };

    await expect(createGroupController(req, res, next))
        .to.eventually.be.rejectedWith(BadRequestError);

    sinon.assert.notCalled(createGroupStub);
    sinon.assert.notCalled(res.status);
    sinon.assert.notCalled(res.send);
    sinon.assert.notCalled(next);
  });
});
