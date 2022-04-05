/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {createSandbox} from 'sinon';
import generateProfilePicController from './generate-profile-pic-controller';
import {UserService} from '../../../models';

const sandbox = createSandbox();

describe('GenerateProfilePicController', function() {
  let req: any;
  let res: any;
  let next: any;
  let generatePicStub: sinon.SinonStub;
  let fakeData: string;

  beforeEach(function() {
    fakeData = 'TEST DATA';

    generatePicStub = sandbox.stub(UserService, 'generateProfilePicture')
        .resolves(fakeData as any);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('creates profile picture with given username and offset', function(done) {
    // Mock express
    req = sandbox.stub();
    const queryData = {
      username: 'TEST',
      offset: 12,
    };

    req.query = queryData;
    req.ip = 'TEST_IP';

    next = sandbox.stub();
    res = sandbox.stub();
    res.type = sandbox.stub();
    res.send = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnceWithExactly(
          generatePicStub,
          req.ip,
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
    req.ip = 'TEST_IP';

    next = sandbox.stub();
    res = sandbox.stub();
    res.type = sandbox.stub();
    res.send = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnceWithExactly(
          generatePicStub,
          req.ip,
          queryData.username,
          0,
      );
      sandbox.assert.calledOnceWithExactly(res.type, 'image/jpeg');
      sandbox.assert.calledOnceWithExactly(res.send, fakeData);

      done();
    });

    generateProfilePicController(req, res, next);
  });
});
