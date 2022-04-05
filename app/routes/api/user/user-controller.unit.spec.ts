/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {createSandbox} from 'sinon';
import {UserService} from '../../../models';
import {expect} from 'chai';
import {userProfilePicController} from './user-controller';

const sandbox = createSandbox();

describe('GetUserProfilePicture', function() {
  let req: any;
  let res: any;
  let next: any;
  let user: any;
  let getProfilePic: sinon.SinonStub;

  beforeEach(function() {
    getProfilePic = sandbox.stub(UserService, 'getProfilePicture');
    user = {
      id: 42,
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns the profile picture data', async function() {
    const userId = 42;

    // Create fake data
    const data = 'TEST';
    const fakePic: any = sandbox.stub();
    fakePic.data = data;
    getProfilePic.resolves(fakePic as any);

    // Stub express function
    req = sandbox.stub();
    res = sandbox.stub();
    next = sandbox.stub();
    req.params = {
      userId,
    };
    req.user = user;
    res.type = sandbox.stub().returnsThis();
    res.send = sandbox.stub();


    await userProfilePicController(req, res, next);

    sandbox.assert.calledOnce(getProfilePic);
    sandbox.assert.calledWith(getProfilePic, user, userId);
    sandbox.assert.calledOnce(res.type);
    sandbox.assert.calledWith(res.type, 'image/jpeg');
    sandbox.assert.calledOnce(res.send);
    sandbox.assert.calledWith(res.send, data);
    sandbox.assert.notCalled(next);
    expect(data).to.equal(data);
  });

  it('calls next with error thrown by ProfilePic.findOne', async function() {
    const userId = 44;

    const err = new Error('TEST ERROR');
    getProfilePic.callsFake(() => Promise.reject(err));

    // Stub express function
    req = sandbox.stub();
    res = sandbox.stub();
    req.params = {
      userId,
    };
    req.user = user;
    next = sandbox.stub();

    await expect(userProfilePicController(req, res, next))
        .to.eventually.be.rejectedWith(err);

    sandbox.assert.calledOnce(getProfilePic);
    sandbox.assert.calledWith(getProfilePic, user, userId);
    sandbox.assert.notCalled(next);
  });
});
