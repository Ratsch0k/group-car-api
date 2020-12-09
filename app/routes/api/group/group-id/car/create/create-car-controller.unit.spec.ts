/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert, match} from 'sinon';
import {BadRequestError} from '../../../../../../errors';
import {CarService} from '../../../../../../models';
import {createCarController} from './create-car-controller';

describe('createCarController', function() {
  let req: any;
  let res: any;
  let next: any;
  let carServiceCreateStub: sinon.SinonStub;

  beforeEach(function() {
    req = {};
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    next = sinon.stub();
    carServiceCreateStub = sinon.stub(CarService, 'create');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError', function() {
    it('if currentUser is not an object', async function() {
      req = {
        params: {
          groupId: '1',
        },
      };

      await expect(createCarController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.status);
      assert.notCalled(res.send);
      assert.notCalled(carServiceCreateStub);
    });

    it('if groupId is parsable to a number', async function() {
      req = {
        params: {
          groupId: 'test',
        },
        user: {
          id: 1,
        },
      };

      await expect(createCarController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(res.status);
      assert.notCalled(res.send);
      assert.notCalled(carServiceCreateStub);
    });
  });

  it('calls CarService.create with the correct arguments', async function() {
    req = {
      params: {
        groupId: 1,
      },
      user: {
        id: 1,
      },
      body: {
        name: 'CAR',
        color: 'Red',
      },
    };

    const fakeCar = {
      groupId: req.params.groupId,
      carId: 1,
      name: req.body.name,
      color: req.body.color,
    };

    carServiceCreateStub.resolves(fakeCar as any);

    await expect(createCarController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        carServiceCreateStub,
        req.user,
        req.params.groupId,
        req.body.name,
        req.body.color,
        match({
          withDriverData: false,
        }),
    );
    assert.calledOnceWithExactly(res.status, 201);
    assert.calledOnceWithExactly(res.send, fakeCar);
  });
});
