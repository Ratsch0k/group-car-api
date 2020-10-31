import {expect} from 'chai';
import sinon, {assert, match} from 'sinon';
import {getCarsController} from './get-cars-controller';
import {BadRequestError} from '../../../../../../errors';
import {CarService} from '../../../../../../models';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('getCarsController', function() {
  let req: any;
  let res: any;
  let next: any;
  let carServiceFindByGroupStub: sinon.SinonStub;

  beforeEach(function() {
    res = {
      send: sinon.stub(),
    };
    next = sinon.stub();

    carServiceFindByGroupStub = sinon.stub(CarService, 'findByGroup');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError', function() {
    it('if user is missing on request', async function() {
      req = {
        params: {
          groupId: 2,
        },
      };

      await expect(getCarsController(req, res, next)).to
          .eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(carServiceFindByGroupStub);
      assert.notCalled(res.send);
      assert.notCalled(next);
    });

    it('if groupId is not parsable to a number', async function() {
      req = {
        params: {
          groupId: 'test',
        },
        user: {
          id: 1,
        },
      };

      await expect(getCarsController(req, res, next)).to
          .eventually.be.rejectedWith(BadRequestError);

      assert.notCalled(carServiceFindByGroupStub);
      assert.notCalled(res.send);
      assert.notCalled(next);
    });
  });

  it('calls CarService.findByGroup and ' +
  'sends the return value', async function() {
    req = {
      params: {
        groupId: 2,
      },
      user: {
        id: 31,
      },
    };

    const cars = [
      {
        groupId: 2,
        id: 1,
        name: 'CAR-1',
      },
      {
        groupId: 2,
        id: 1,
        name: 'CAR-2',
      },
    ];
    carServiceFindByGroupStub.resolves(cars);

    await expect(getCarsController(req, res, next)).to
        .eventually.be.fulfilled;

    assert.calledOnceWithExactly(
        carServiceFindByGroupStub,
        req.user,
        req.params.groupId,
    );
    assert.calledOnceWithExactly(res.send, match({cars}));
  });
});
