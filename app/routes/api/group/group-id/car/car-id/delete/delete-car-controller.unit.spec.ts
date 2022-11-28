/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {CarService} from '../../../../../../../models';
import {Response} from 'express';
import {expect} from 'chai';
import {deleteCarController} from './delete-car-controller';
import {BadRequestError} from '../../../../../../../errors';

describe('deleteCarController', function() {
  let deleteStub: sinon.SinonStub;
  let resStub: Partial<Response>;
  let nextStub: sinon.SinonStub;
  let req: any;

  beforeEach(function() {
    deleteStub = sinon.stub(CarService, 'delete');
    resStub = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    nextStub = sinon.stub();

    req = {
      params: {
        groupId: '21',
        carId: '42',
      },
      user: {
        username: 'TEST_USER',
        email: 'TEST@MAIL.COM',
        id: 11,
        isBetaUser: false,
      } as unknown as Express.User,
    };
  });

  afterEach(function() {
    // Next should never be called
    assert.notCalled(nextStub);

    sinon.restore();
  });

  describe('throws BadRequestError if ', function() {
    it('groupId can\'t be parsed to int', async function() {
      // Remove groupId
      req.params.groupId = undefined;

      await expect(deleteCarController(req, resStub as any, nextStub))
          .to.be.rejectedWith(BadRequestError);

      // Change groupId to be not parsable
      req.params.groupId = 'NONONO';

      await expect(deleteCarController(req, resStub as any, nextStub))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(deleteStub);
    });

    it('carId can\'t be parsed to int', async function() {
      // Remove carId
      req.params.carId = undefined;

      await expect(deleteCarController(req, resStub as any, nextStub))
          .to.be.rejectedWith(BadRequestError);

      // Change carId to be not parsable
      req.params.carId = 'NONONO';

      await expect(deleteCarController(req, resStub as any, nextStub))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(deleteStub);
    });
    it('user missing on request', async function() {
      // Remove carId
      req.user = undefined;

      await expect(deleteCarController(req, resStub as any, nextStub))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(deleteStub);
    });
  });

  it('calls CarService.delete with correct arguments and responses with ' +
    'status code 204', async function() {
    await expect(deleteCarController(req, resStub as any, nextStub))
        .to.be.eventually.fulfilled;

    assert.calledOnceWithExactly(deleteStub, match(req.user), 21, 42);
    assert.calledOnceWithExactly(resStub.status as any, 204);
    assert.calledOnce(resStub.send as any);
  });
});
