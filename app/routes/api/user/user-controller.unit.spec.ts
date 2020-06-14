/* eslint-disable @typescript-eslint/no-explicit-any */
import {createSandbox, match} from 'sinon';
import {ProfilePic} from '../../../models';
import Bluebird from 'bluebird';
import {expect} from 'chai';
import {userProfilePicController} from './user-controller';
import {UserNotFoundError} from '../../../errors';

const sandbox = createSandbox();

describe('GetUserProfilePicture', function() {
  let req: any;
  let res: any;
  let next: any;
  afterEach(() => {
    sandbox.restore();
  });

  it('returns the profile picture data', function(done) {
    const userId = 42;

    // Create fake data
    const data = 'TEST';
    const fakePic: any = sandbox.stub();
    fakePic.data = data;
    const findOneStub = sandbox.stub(ProfilePic, 'findOne');
    findOneStub.usingPromise(Bluebird).resolves(fakePic as any);

    // Stub express function
    req = sandbox.stub();
    res = sandbox.stub();
    next = sandbox.stub();
    req.params = {
      userId,
    };

    res.type = sandbox.stub();

    res.send = sandbox.stub().callsFake((data) => {
      sandbox.assert.calledOnce(findOneStub);
      sandbox.assert.calledWith(findOneStub, match({where: {userId}}));
      sandbox.assert.calledOnce(res.type);
      sandbox.assert.calledWith(res.type, 'image/jpeg');
      sandbox.assert.calledOnce(res.send);
      sandbox.assert.calledWith(res.send, data);
      expect(data).to.equal(data);
      done();
    });


    userProfilePicController(req, res, next);
  });

  it('throws UserNotFoundError if no profile pic is found', function(done) {
    const userId = 43;

    const findOneStub = sandbox.stub(ProfilePic, 'findOne');
    findOneStub.usingPromise(Bluebird).resolves(null as any);

    // Stub express function
    req = sandbox.stub();
    res = sandbox.stub();
    req.params = {
      userId,
    };
    next = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnce(findOneStub);
      sandbox.assert.calledWith(findOneStub, match({where: {userId}}));
      sandbox.assert.calledWith(next, match.instanceOf(UserNotFoundError));
      done();
    });

    userProfilePicController(req, res, next);
  });

  it('calls next with error thrown by ProfilePic.findOne', function(done) {
    const userId = 44;

    const findOneStub = sandbox.stub(ProfilePic, 'findOne');

    const err = new Error('TEST ERROR');
    findOneStub.usingPromise(Bluebird).rejects(err);

    // Stub express function
    req = sandbox.stub();
    res = sandbox.stub();
    req.params = {
      userId,
    };
    next = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnce(findOneStub);
      sandbox.assert.calledWith(findOneStub, match({where: {userId}}));
      sandbox.assert.calledWith(next, err);
      done();
    });

    userProfilePicController(req, res, next);
  });
});
