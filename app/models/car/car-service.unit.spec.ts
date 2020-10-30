/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert, match} from 'sinon';
import {MembershipNotFoundError, NotAdminOfGroupError} from '../../errors';
import {MembershipRepository} from '../membership';
import CarRepository from './car-repository';
import CarService from './car-service';

describe('CarService', function() {
  const user: any = {
    id: 1,
  };
  let fakeCar: any;

  beforeEach(function() {
    fakeCar = {
      groupId: 1,
      carId: 1,
      color: 'Blue',
      name: 'CAR',
      get: sinon.stub().resolvesThis(),
    };
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('create', function() {
    let membershipRepFindStub: sinon.SinonStub;
    let carRepCreateStub: sinon.SinonStub;

    beforeEach(function() {
      membershipRepFindStub = sinon.stub(MembershipRepository, 'findById');
      carRepCreateStub = sinon.stub(CarRepository, 'create');
    });

    describe('throws NotAdminOfGroup', function() {
      it('if user is not a member of the group', async function() {
        membershipRepFindStub.rejects(
            new MembershipNotFoundError({groupId: 1, userId: 1}),
        );

        await expect(CarService.create(
            user,
            fakeCar.groupId,
            fakeCar.name,
            fakeCar.color as any,
        )).to.be.rejectedWith(NotAdminOfGroupError);

        assert.calledOnceWithExactly(
            membershipRepFindStub,
            match({groupId: fakeCar.groupId, userId: user.id}),
        );
        assert.notCalled(carRepCreateStub);
      });

      it('if user is a member but not an admin of the group', async function() {
        const fakeMembership = {
          groupId: fakeCar.groupId,
          userId: user.id,
          isAdmin: false,
        };

        membershipRepFindStub.resolves(fakeMembership as any);

        await expect(CarService.create(
            user,
            fakeCar.groupId,
            fakeCar.name,
          fakeCar.color as any,
        )).to.be.rejectedWith(NotAdminOfGroupError);

        assert.calledOnceWithExactly(
            membershipRepFindStub,
            match({groupId: fakeCar.groupId, userId: user.id}),
        );
        assert.notCalled(carRepCreateStub);
      });
    });

    it('creates the car and returns the plain object', async function() {
      const fakeMembership = {
        groupId: fakeCar.groupId,
        userId: user.id,
        isAdmin: true,
      };

      membershipRepFindStub.resolves(fakeMembership as any);
      carRepCreateStub.resolves(fakeCar);

      await expect(CarService.create(
          user,
          fakeCar.groupId,
          fakeCar.name,
        fakeCar.color as any,
      )).to.eventually.equal(fakeCar as any);

      assert.calledOnceWithExactly(
          membershipRepFindStub,
          match({groupId: fakeCar.groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(
          carRepCreateStub,
          fakeCar.groupId,
          fakeCar.name,
          fakeCar.color,
          match.falsy,
      );
      assert.calledOnceWithExactly(fakeCar.get, match({plain: true}));
    });
  });
});
