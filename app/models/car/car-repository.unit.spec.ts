/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert, match} from 'sinon';
import {Car} from './car';
import {CarRepository} from './car-repository';
import {CarNotFoundError, InternalError} from '../../errors';
import sequelize from '../../db';
import Sequelize from 'sequelize';

describe('CarRepository', function() {
  const fakeCar = {
    groupId: 1,
    carId: 6,
    name: 'CAR',
    color: 'Green',
  };

  afterEach(function() {
    sinon.restore();
  });

  describe('create', function() {
    let createStub: sinon.SinonStub;
    let findOneStub: sinon.SinonStub;
    let transactionStub: sinon.SinonStub;

    beforeEach(function() {
      createStub = sinon.stub(Car, 'create');
      findOneStub = sinon.stub(Car, 'findOne');
      transactionStub = sinon.stub(sequelize, 'transaction');
    });

    it('creates car with specified values', async function() {
      createStub.resolves(fakeCar as any);
      findOneStub.resolves({get: () => fakeCar.carId - 1});
      const transaction = {field: 'TEST FIELD'};
      transactionStub.callsFake((fn) => {
        return fn(transaction);
      });

      await expect(CarRepository.create(
          fakeCar.groupId,
          fakeCar.name,
          fakeCar.color as any,
      )).to.eventually.equal(fakeCar);

      sinon.assert.calledOnceWithExactly(transactionStub, match.func);
      sinon.assert.calledOnceWithExactly(
          findOneStub,
          match({
            attributes: [[
              Sequelize.fn('MAX', Sequelize.col('carId')), 'max_id',
            ]],
            where: {
              groupId: fakeCar.groupId,
            },
            transaction: transaction,
          }),
      );
      sinon.assert.calledOnceWithExactly(
          createStub,
          match({
            groupId: fakeCar.groupId,
            name: fakeCar.name,
            color: fakeCar.color,
            carId: fakeCar.carId,
          }),
          match.any,
      );
    });

    it('catches error and throws InternalError instead', async function() {
      createStub.rejects(new Error('Should not be thrown'));
      findOneStub.rejects(new Error('Should not be thrown'));
      const transaction = {field: 'TEST FIELD'};
      transactionStub.callsFake((fn) => {
        return fn(transaction);
      });

      await expect(CarRepository.create(
          fakeCar.groupId,
          fakeCar.name,
        fakeCar.color as any,
      )).to.be.rejectedWith(InternalError);

      sinon.assert.calledOnceWithExactly(transactionStub, match.func);
      sinon.assert.calledOnceWithExactly(
          findOneStub,
          match({
            attributes: [[
              Sequelize.fn('MAX', Sequelize.col('carId')), 'max_id',
            ]],
            where: {
              groupId: fakeCar.groupId,
            },
            transaction: transaction,
          }),
      );
      assert.notCalled(createStub);
    });
  });

  describe('findByGroup', function() {
    it('throws InternalError error if find throws an error', async function() {
      const findAllStub = sinon.stub(Car, 'findAll');
      findAllStub.rejects(new Error('Should not be thrown'));

      await expect(CarRepository.findByGroup(1))
          .to.eventually.be.rejectedWith(InternalError);

      assert.calledOnceWithExactly(
          findAllStub,
          match({
            where: {
              groupId: 1,
            },
          }),
      );
    });

    it('calls findAll with the correct parameters', async function() {
      const cars = [
        {
          groupId: 1,
          id: 1,
          name: 'FIRST',
        },
        {
          groupId: 1,
          id: 2,
          name: 'SECOND',
        },
      ];

      const findAllStub = sinon.stub(Car, 'findAll');
      findAllStub.resolves(cars as any);

      await expect(CarRepository.findByGroup(1))
          .to.eventually.be.equal(cars);

      assert.calledOnceWithExactly(
          findAllStub,
          match({
            where: {
              groupId: 1,
            },
          }),
      );
    });
  });

  describe('findById', function() {
    let findOneStub: sinon.SinonStub;

    beforeEach(function() {
      findOneStub = sinon.stub(Car, 'findOne');
    });

    const id = {
      groupId: 1,
      carId: 1,
    };

    it('throws CarNotFoundError if car doesn\'t exist', async function() {
      findOneStub.resolves(null);

      await expect(CarRepository.findById(id))
          .to.eventually.be.rejectedWith(CarNotFoundError);

      assert.calledOnceWithExactly(
          findOneStub,
          match({where: id, include: match.any}),
      );
    });

    it('catches error of query and throws InternalError instead',
        async function() {
          findOneStub.rejects(new Error('Should not be thrown'));

          await expect(CarRepository.findById(id))
              .to.eventually.be.rejectedWith(InternalError);

          assert.calledOnceWithExactly(
              findOneStub,
              match({where: id, include: match.any}),
          );
        });

    it('gets car with the specified id', async function() {
      const car = {
        name: 'Car',
        groupId: 1,
        carId: 1,
      };
      findOneStub.resolves(car as any);

      await expect(CarRepository.findById(id))
          .to.eventually.equal(car);

      assert.calledOnceWithExactly(
          findOneStub,
          match({where: id, include: match.any}),
      );
    });
  });
});
