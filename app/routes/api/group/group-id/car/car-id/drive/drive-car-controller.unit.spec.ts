/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert} from 'sinon';
import {CarService} from '../../../../../../../models';
import {BadRequestError} from '../../../../../../../errors';
import {driveCarController} from './drive-car-controller';

describe('driveCarController', function() {
  let req: any;
  let res: any;
  let next: any;
  let carServiceRegisterStub: sinon.SinonStub;

  beforeEach(function() {
    res = {
      send: sinon.stub(),
      status: sinon.stub().returnsThis(),
    };
    next = sinon.stub();

    carServiceRegisterStub = sinon.stub(CarService, 'driveCar');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError', function() {
    it('if user is not an object', async function() {
      req = {
        params: {
          carId: 1,
          groupId: 2,
        },
      };

      await expect(driveCarController(req, req, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.send);
      assert.notCalled(res.status);
      assert.notCalled(carServiceRegisterStub);
    });

    it('if groupId is not parsable to a number', async function() {
      req = {
        user: {
          id: 5,
        },
        params: {
          carId: 1,
          groupId: 'test',
        },
      };

      await expect(driveCarController(req, req, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.send);
      assert.notCalled(res.status);
      assert.notCalled(carServiceRegisterStub);
    });

    it('if carId is not parsable to a number', async function() {
      req = {
        user: {
          id: 5,
        },
        params: {
          carId: 'test',
          groupId: 2,
        },
      };

      await expect(driveCarController(req, req, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.send);
      assert.notCalled(res.status);
      assert.notCalled(carServiceRegisterStub);
    });
  });

  it('calls CarService.driveCar with correct ' +
  'parameters', async function() {
    req = {
      user: {
        id: 5,
      },
      params: {
        carId: 1,
        groupId: 2,
      },
    };

    await expect(driveCarController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        carServiceRegisterStub,
        req.user,
        req.params.groupId,
        req.params.carId,
    );
    assert.calledOnceWithExactly(res.status, 204);
    assert.calledOnceWithExactly(res.send);
  });
});
