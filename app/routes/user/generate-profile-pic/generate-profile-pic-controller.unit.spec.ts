import {createSandbox} from 'sinon';
import generateProfilePicController from './generate-profile-pic-controller';
import * as generatePic from '../../../util/generate-profile-pic';
import config from '../../../config';

const sandbox = createSandbox();

describe('GenerateProfilePicController', function() {
  let req: any;
  let res: any;
  let next: any;
  const dim = config.user.pb.dimensions;

  afterEach(function() {
    sandbox.restore();
  });

  it('creates profile picture with given username and offset', function(done) {
    // Mock generatePic method
    const fakeData = 'TEST DATA';
    const generatePicStub = sandbox.stub(generatePic, 'default')
        .resolves(fakeData as any);

    // Mock express
    req = sandbox.stub();
    const queryData = {
      username: 'TEST',
      offset: 12,
    };

    req.query = queryData;

    next = sandbox.stub();
    res = sandbox.stub();
    res.type = sandbox.stub();
    res.send = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnceWithExactly(
          generatePicStub,
          dim,
          queryData.username,
          queryData.offset,
      );
      sandbox.assert.calledOnceWithExactly(res.type, 'image/jpeg');
      sandbox.assert.calledOnceWithExactly(res.send, fakeData);

      done();
    });

    generateProfilePicController(req, res, next);
  });

  it('creates profile picture with offset ' +
  '0 if no offset provided', function(done) {
    // Mock generatePic method
    const fakeData = 'TEST DATA';
    const generatePicStub = sandbox.stub(generatePic, 'default')
        .resolves(fakeData as any);

    // Mock express
    req = sandbox.stub();
    const queryData = {
      username: 'TEST',
      /*
       * Because of sanitization chain the
       * parameter offset is always provided either as NaN or as number
       */
      offset: NaN,
    };

    req.query = queryData;

    next = sandbox.stub();
    res = sandbox.stub();
    res.type = sandbox.stub();
    res.send = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnceWithExactly(
          generatePicStub,
          dim,
          queryData.username,
          0,
      );
      sandbox.assert.calledOnceWithExactly(res.type, 'image/jpeg');
      sandbox.assert.calledOnceWithExactly(res.send, fakeData);

      done();
    });

    generateProfilePicController(req, res, next);
  });

  it('calls next with error if ' +
      'generateProfilePic throws an error', function(done) {
    // Mock generatePic method
    const err = new Error('TEST MESSAGE');
    const generatePicStub = sandbox.stub(generatePic, 'default')
        .rejects(err);

    // Mock express
    req = sandbox.stub();
    const queryData = {
      username: 'TEST',
      offset: 12,
    };

    req.query = queryData;
    res = sandbox.stub();
    res.type = sandbox.stub();
    res.send = sandbox.stub();
    next = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnceWithExactly(
          generatePicStub,
          dim,
          queryData.username,
          queryData.offset,
      );
      sandbox.assert.notCalled(res.type);
      sandbox.assert.notCalled(res.send);

      sandbox.assert.calledOnceWithExactly(next, err);
      done();
    });

    generateProfilePicController(req, res, next);
  });
});
