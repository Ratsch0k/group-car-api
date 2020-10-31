/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {match} from 'sinon';
import {Car} from './car';
import {CarRepository} from './car-repository';
import {InternalError} from '../../errors';

describe('CarRepository', function() {
  const fakeCar = {
    groupId: 1,
    carId: 1,
    name: 'CAR',
    color: 'Green',
  };

  afterEach(function() {
    sinon.restore();
  });

  describe('create', function() {
    it('creates car with specified values', async function() {
      const createStub = sinon.stub(Car, 'create');
      createStub.resolves(fakeCar as any);

      await CarRepository.create(
          fakeCar.groupId,
          fakeCar.name,
          fakeCar.color as any,
      );

      sinon.assert.calledOnceWithExactly(
          createStub,
          match({
            groupId: fakeCar.groupId,
            name: fakeCar.name,
            color: fakeCar.color,
          }),
          match.any,
      );
    });

    it('catches error and throws InternalError instead', async function() {
      const createStub = sinon.stub(Car, 'create');
      createStub.rejects(new Error('Should not be thrown'));

      await expect(CarRepository.create(
          fakeCar.groupId,
          fakeCar.name,
        fakeCar.color as any,
      )).to.be.rejectedWith(InternalError);

      sinon.assert.calledOnceWithExactly(
          createStub,
          match({
            groupId: fakeCar.groupId,
            name: fakeCar.name,
            color: fakeCar.color,
          }),
          match.any,
      );
    });
  });
});
