/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert} from 'sinon';
import {BadRequestError} from '../../../../../../../errors';
import CarService from '../../../../../../../models/car/car-service';
import {parkCarController} from './park-car-controller';

describe('parkCarController', function() {
  let parkCarStub: sinon.SinonStub;

  let req: any;
  let res: any;
  let next: any;

  beforeEach(function() {
    parkCarStub = sinon.stub(CarService, 'parkCar');

    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };
    next = sinon.stub();
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError', function() {
    it('if user is not an object', async function() {
      req = {
        params: {
          groupId: 6,
          carId: 19,
        },
        body: {
          latitude: 82.1,
          longitude: 12.3,
        },
      };

      await expect(parkCarController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(parkCarStub);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('if groupId is not parsable to an integer', async function() {
      req = {
        user: {
          id: 77,
        },
        params: {
          groupId: 'test',
          carId: 19,
        },
        body: {
          latitude: 82.1,
          longitude: 12.3,
        },
      };

      await expect(parkCarController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(parkCarStub);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('if carId is not parsable to an integer', async function() {
      req = {
        user: {
          id: 77,
        },
        params: {
          groupId: 5,
          carId: 'test',
        },
        body: {
          latitude: 82.1,
          longitude: 12.3,
        },
      };

      await expect(parkCarController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(parkCarStub);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('if latitude is not parsable to a float', async function() {
      req = {
        user: {
          id: 77,
        },
        params: {
          groupId: 5,
          carId: 51,
        },
        body: {
          latitude: 'test',
          longitude: 12.3,
        },
      };

      await expect(parkCarController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(parkCarStub);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('if longitude is not parsable to a float', async function() {
      req = {
        user: {
          id: 77,
        },
        params: {
          groupId: 5,
          carId: 51,
        },
        body: {
          latitude: 82.1,
          longitude: 'test',
        },
      };

      await expect(parkCarController(req, res, next))
          .to.be.rejectedWith(BadRequestError);

      assert.notCalled(parkCarStub);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });
  });

  it('calls CarService.parkCar with correct parameters ' +
  'and sends a response with 204', async function() {
    req = {
      user: {
        id: 77,
      },
      params: {
        groupId: 5,
        carId: 51,
      },
      body: {
        latitude: 82.1,
        longitude: 41.8,
      },
    };

    await expect(parkCarController(req, res, next))
        .to.be.fulfilled;

    assert.calledOnceWithExactly(
        parkCarStub,
        req.user,
        req.params.groupId,
        req.params.carId,
        req.body.latitude,
        req.body.longitude,
    );
    assert.calledOnceWithExactly(res.status, 204);
    assert.calledOnceWithExactly(res.send);
  });
});
