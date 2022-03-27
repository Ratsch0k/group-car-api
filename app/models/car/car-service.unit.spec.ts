/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert, match} from 'sinon';
import {
  CarColorAlreadyInUseError,
  CarInUseError,
  CarNameAlreadyInUseError,
  CarNotFoundError,
  InternalError,
  MaxCarAmountReachedError,
  MembershipNotFoundError,
  NotAdminOfGroupError,
  NotDriverOfCarError,
  NotMemberOfGroupError,
} from '../../errors';
import {
  Membership,
  MembershipRepository,
  MembershipService,
} from '../membership';
import CarRepository from './car-repository';
import CarService from './car-service';
import config from '../../config';
import sequelize from '../../db';
import {GroupCarAction, GroupNotificationService} from '../group';

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
    let carRepFindByGroup: sinon.SinonStub;
    let groupNotifStub: sinon.SinonStub;

    beforeEach(function() {
      membershipRepFindStub = sinon.stub(MembershipRepository, 'findById');
      carRepCreateStub = sinon.stub(CarRepository, 'create');
      carRepFindByGroup = sinon.stub(CarRepository, 'findByGroup');
      groupNotifStub = sinon.stub(GroupNotificationService, 'notifyCarUpdate');
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
        assert.notCalled(carRepFindByGroup);
        assert.notCalled(carRepCreateStub);
        assert.notCalled(groupNotifStub);
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
        assert.notCalled(carRepFindByGroup);
        assert.notCalled(carRepCreateStub);
        assert.notCalled(groupNotifStub);
      });
    });

    it('throws MaxCarAmountReachedError if group already ' +
    'has max amount of cars', async function() {
      const fakeMembership = {
        groupId: fakeCar.groupId,
        userId: user.id,
        isAdmin: true,
      };

      membershipRepFindStub.resolves(fakeMembership as any);

      const maxAmount = config.group.maxCars;
      const cars = Array(maxAmount).fill({name: 'TEST'});
      carRepFindByGroup.resolves(cars);

      await expect(CarService.create(
          user,
          fakeCar.groupId,
          fakeCar.name,
        fakeCar.color as any,
      )).to.be.rejectedWith(MaxCarAmountReachedError);

      assert.calledOnceWithExactly(
          membershipRepFindStub,
          match({groupId: fakeCar.groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(carRepFindByGroup, fakeCar.groupId);
      assert.notCalled(carRepCreateStub);
      assert.notCalled(groupNotifStub);
    });

    it('throws CarNameAlreadyInUserError if a car with the ' +
    'name already exists in that group', async function() {
      const fakeMembership = {
        groupId: fakeCar.groupId,
        userId: user.id,
        isAdmin: true,
      };

      membershipRepFindStub.resolves(fakeMembership as any);

      carRepFindByGroup.resolves([{name: fakeCar.name}]);

      await expect(CarService.create(
          user,
          fakeCar.groupId,
          fakeCar.name,
        fakeCar.color as any,
      )).to.be.rejectedWith(CarNameAlreadyInUseError);

      assert.calledOnceWithExactly(
          membershipRepFindStub,
          match({groupId: fakeCar.groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(carRepFindByGroup, fakeCar.groupId);
      assert.notCalled(carRepCreateStub);
      assert.notCalled(groupNotifStub);
    });

    it('throws CarColorAlreadyInUseError if a car with the '+
    'color already exists in that group', async function() {
      const fakeMembership = {
        groupId: fakeCar.groupId,
        userId: user.id,
        isAdmin: true,
      };

      membershipRepFindStub.resolves(fakeMembership as any);

      carRepFindByGroup.resolves([{
        name: fakeCar.name + ' more',
        color: fakeCar.color,
      }]);

      await expect(CarService.create(
          user,
          fakeCar.groupId,
          fakeCar.name,
        fakeCar.color as any,
      )).to.be.rejectedWith(CarColorAlreadyInUseError);

      assert.calledOnceWithExactly(
          membershipRepFindStub,
          match({groupId: fakeCar.groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(carRepFindByGroup, fakeCar.groupId);
      assert.notCalled(carRepCreateStub);
      assert.notCalled(groupNotifStub);
    });

    it('creates the car and returns the plain object', async function() {
      const fakeMembership = {
        groupId: fakeCar.groupId,
        userId: user.id,
        isAdmin: true,
      };

      membershipRepFindStub.resolves(fakeMembership as any);
      carRepFindByGroup.resolves([]);
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
      assert.calledOnceWithExactly(carRepFindByGroup, fakeCar.groupId);
      assert.calledOnceWithExactly(
          groupNotifStub,
          fakeCar.groupId,
          fakeCar.carId,
          GroupCarAction.Add,
          fakeCar,
      );
    });
  });

  describe('findByGroup', function() {
    let membershipFindByIdStub: sinon.SinonStub;
    let carRepFindByGroup: sinon.SinonStub;

    beforeEach(function() {
      membershipFindByIdStub = sinon.stub(MembershipRepository, 'findById');
      carRepFindByGroup = sinon.stub(CarRepository, 'findByGroup');
    });

    it('throws NotMemberOfGroup if user is not ' +
    'member of the group', async function() {
      const user: any = {
        id: 1,
      };
      const groupId = 10;

      membershipFindByIdStub.rejects(
          new MembershipNotFoundError({groupId, userId: user.id}));

      await expect(CarService.findByGroup(user, groupId))
          .to.eventually.be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(
          membershipFindByIdStub,
          match({groupId, userId: user.id}),
      );
      assert.notCalled(carRepFindByGroup);
    });

    it('if checking membership throws an error, ' +
    'it will be rethrown', async function() {
      const user: any = {
        id: 1,
      };
      const groupId = 10;

      const error = new Error('Should be forwarded');
      membershipFindByIdStub.rejects(error);

      await expect(CarService.findByGroup(user, groupId))
          .to.eventually.be.rejectedWith(error);

      assert.calledOnceWithExactly(
          membershipFindByIdStub,
          match({groupId, userId: user.id}),
      );
      assert.notCalled(carRepFindByGroup);
    });

    it('calls CarRepository.findByGroup with ' +
    'the correct arguments', async function() {
      const user: any = {
        id: 1,
      };
      const groupId = 10;

      membershipFindByIdStub.resolves();

      const cars = [
        {
          groupId: 10,
          id: 1,
          name: 'CAR-1',
        },
        {
          groupId: 10,
          id: 2,
          name: 'CAR-2',
        },
      ];
      carRepFindByGroup.resolves(cars);

      await expect(CarService.findByGroup(user, groupId))
          .to.eventually.be.equal(cars);

      assert.calledOnceWithExactly(
          membershipFindByIdStub,
          match({groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(carRepFindByGroup, groupId, match.any);
    });
  });

  describe('driveCar', function() {
    let membershipServiceIsMember: sinon.SinonStub;
    let transactionStub: sinon.SinonStub;
    let carRepFindById: sinon.SinonStub;
    let t: {commit: sinon.SinonStub, rollback: sinon.SinonStub};
    let groupNotifStub: sinon.SinonStub;
    const user: any = {
      id: 1,
    };

    beforeEach(function() {
      t = {
        commit: sinon.stub(),
        rollback: sinon.stub(),
      };
      membershipServiceIsMember = sinon.stub(MembershipService, 'isMember');
      transactionStub = sinon.stub(sequelize, 'transaction').resolves(t as any);
      carRepFindById = sinon.stub(CarRepository, 'findById');
      groupNotifStub = sinon.stub(GroupNotificationService, 'notifyCarUpdate');
    });

    it('throws NotMemberOfGroupError if current ' +
    'user is not a member of the group', async function() {
      membershipServiceIsMember.resolves(false);

      await expect(CarService.driveCar(user, 2, 3))
          .to.eventually.be.rejectedWith(NotMemberOfGroupError);

      assert.notCalled(transactionStub);
      assert.notCalled(carRepFindById);
      assert.notCalled(t.commit);
      assert.notCalled(t.rollback);
      assert.notCalled(groupNotifStub);
    });

    it('throws CarInUseError if user has already a driver', async function() {
      membershipServiceIsMember.resolves(true);
      const car = {
        groupId: 2,
        carId: 3,
        name: 'Car',
        driverId: 4,
        update: sinon.stub(),
      };
      carRepFindById.resolves(car as any);

      await expect(CarService.driveCar(user, car.groupId, car.carId))
          .to.eventually.be.rejectedWith(CarInUseError);

      assert.calledOnceWithExactly(
          carRepFindById,
          match({carId: car.carId, groupId: car.groupId}),
          match({transaction: t}),
      );
      assert.calledOnce(transactionStub);
      assert.calledOnce(t.rollback);
      assert.notCalled(car.update);
      assert.notCalled(t.commit);
      assert.notCalled(groupNotifStub);
    });

    it('throws InternalError if error occurred while registering ' +
    'which is not CarInUseError or NotMemberOfGroupError', async function() {
      membershipServiceIsMember.resolves(true);
      carRepFindById.rejects(new Error('Should not be thrown'));

      await expect(CarService.driveCar(user, 1, 2))
          .to.eventually.be.rejectedWith(InternalError);

      assert.calledOnceWithExactly(
          carRepFindById,
          match({carId: 2, groupId: 1}),
          match({transaction: t}),
      );
      assert.calledOnce(t.rollback);
      assert.calledOnce(transactionStub);
      assert.notCalled(groupNotifStub);
    });

    it('sets driverId to id of current user', async function() {
      membershipServiceIsMember.resolves(true);
      const car = {
        groupId: 2,
        carId: 3,
        name: 'Car',
        driverId: null,
        update: sinon.stub().resolvesThis(),
        get: sinon.stub().returnsThis(),
      };
      carRepFindById.resolves(car as any);

      await expect(CarService.driveCar(user, car.groupId, car.carId))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(
          carRepFindById,
          match({carId: car.carId, groupId: car.groupId}),
          match({transaction: t}),
      );
      assert.calledOnce(transactionStub);
      assert.calledOnce(t.commit);
      assert.calledOnceWithMatch(
          car.update,
          match({driverId: user.id}),
          match({transaction: t}),
      );
      assert.calledOnceWithExactly(car.get, match({plain: true}));
      assert.calledOnceWithExactly(
          groupNotifStub,
          car.groupId,
          car.carId,
          GroupCarAction.Drive,
          car,
      );
      assert.notCalled(t.rollback);
    });
  });

  describe('parkCar', function() {
    let isMemberStub: sinon.SinonStub;
    let transactionStub: sinon.SinonStub;
    let findByIdStub: sinon.SinonStub;
    let t: {commit: sinon.SinonStub, rollback: sinon.SinonStub};
    let groupNotifStub: sinon.SinonStub;
    const user: any = {
      id: 10,
    };

    beforeEach(function() {
      isMemberStub = sinon.stub(MembershipService, 'isMember');
      t = {
        commit: sinon.stub(),
        rollback: sinon.stub(),
      };
      transactionStub = sinon.stub(sequelize, 'transaction')
          .resolves(t as any);
      findByIdStub = sinon.stub(CarRepository, 'findById');
      groupNotifStub = sinon.stub(GroupNotificationService, 'notifyCarUpdate');
    });

    it('throws NotMemberOfGroupError if user ' +
    'is not member of the specified group', async function() {
      isMemberStub.resolves(false);

      const groupId = 5;
      const carId = 6;
      const latitude = 1.2;
      const longitude = 89.53;

      await expect(CarService.parkCar(
          user,
          groupId,
          carId,
          latitude,
          longitude,
      )).to.eventually.be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(isMemberStub, user, groupId);
      assert.notCalled(transactionStub);
      assert.notCalled(findByIdStub);
      assert.notCalled(groupNotifStub);
    });

    it('throws NotDriverOfCarError if user is ' +
    'not the driver of the car', async function() {
      const groupId = 5;
      const carId = 6;
      const latitude = 1.2;
      const longitude = 89.53;
      const car = {
        carId,
        groupId,
        name: 'Car',
        driverId: user.id + 2,
        update: sinon.stub().resolves(),
      };

      isMemberStub.resolves(true);
      findByIdStub.resolves(car as any);

      await expect(CarService.parkCar(
          user,
          groupId,
          carId,
          latitude,
          longitude,
      )).to.eventually.be.rejectedWith(NotDriverOfCarError);

      assert.calledOnceWithExactly(isMemberStub, user, groupId);
      assert.calledOnce(transactionStub);
      assert.calledOnceWithExactly(
          findByIdStub,
          match({carId, groupId}),
          match({transaction: t}),
      );
      assert.calledOnce(t.rollback);
      assert.notCalled(car.update);
    });

    it('if user is driver of car, sets driverId to null '+
    'and sets latitude and longitude', async function() {
      const groupId = 5;
      const carId = 6;
      const latitude = 1.2;
      const longitude = 89.53;
      const car = {
        carId,
        groupId,
        name: 'Car',
        driverId: user.id,
        update: sinon.stub().resolvesThis(),
        get: sinon.stub().returnsThis(),
      };

      isMemberStub.resolves(true);
      findByIdStub.resolves(car as any);

      await expect(CarService.parkCar(
          user,
          groupId,
          carId,
          latitude,
          longitude,
      )).to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(isMemberStub, user, groupId);
      assert.calledOnce(transactionStub);
      assert.calledOnceWithExactly(
          findByIdStub,
          match({carId, groupId}),
          match({transaction: t}),
      );
      assert.calledOnceWithExactly(
          car.update,
          match({driverId: null, latitude, longitude}),
          match({transaction: t}),
      );
      assert.calledOnceWithExactly(car.get, match({plain: true}));
      assert.calledOnceWithExactly(
          groupNotifStub,
          car.groupId,
          car.carId,
          GroupCarAction.Park,
          car,
      );
      assert.calledOnce(t.commit);
      assert.notCalled(t.rollback);
    });

    it('throws InternalError instead of any error other than ' +
    'NotMemberOfGroupError or NotDriverOfCarError', async function() {
      const groupId = 5;
      const carId = 6;
      const latitude = 1.2;
      const longitude = 89.53;
      const car = {
        carId,
        groupId,
        name: 'Car',
        driverId: user.id,
        update: sinon.stub().rejects(new Error('Should not be thrown')),
      };

      isMemberStub.resolves(true);
      findByIdStub.resolves(car as any);

      await expect(CarService.parkCar(
          user,
          groupId,
          carId,
          latitude,
          longitude,
      )).to.eventually.be.rejectedWith(InternalError);

      assert.calledOnceWithExactly(isMemberStub, user, groupId);
      assert.calledOnce(transactionStub);
      assert.calledOnceWithExactly(
          findByIdStub,
          match({carId, groupId}),
          match({transaction: t}),
      );
      assert.calledOnceWithExactly(
          car.update,
          match({driverId: null, latitude, longitude}),
          match({transaction: t}),
      );
      assert.calledOnce(t.rollback);
      assert.notCalled(t.commit);
      assert.notCalled(groupNotifStub);
    });
  });

  describe('delete', function() {
    let findMembershipStub: sinon.SinonStub;
    let repositoryDeleteStub: sinon.SinonStub;
    let notifyStub: sinon.SinonStub;

    beforeEach(function() {
      findMembershipStub = sinon.stub(MembershipService, 'findById');
      repositoryDeleteStub = sinon.stub(CarRepository, 'delete');
      notifyStub = sinon.stub(GroupNotificationService, 'notifyCarUpdate');
    });

    it('throws NotMemberOfGroupError if currentUser is ' +
      'not a member of the group', async function() {
      findMembershipStub.callsFake(() =>
        Promise.reject(new NotMemberOfGroupError()));

      const groupId = 1;
      const carId = 1;

      await expect(CarService.delete(user, groupId, carId))
          .to.be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(
          findMembershipStub,
          user,
          match({groupId, userId: user.id}),
      );
      assert.notCalled(repositoryDeleteStub);
      assert.notCalled(notifyStub);
    });

    it('throws NotAdminOfGroupError if currentUser is a member of the ' +
      'group but not an admin', async function() {
      const groupId = 1;
      const carId = 1;

      const membership = {
        groupId,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      } as Membership;

      findMembershipStub.resolves(membership);

      await expect(CarService.delete(user, groupId, carId))
          .to.be.rejectedWith(NotAdminOfGroupError);

      assert.calledOnceWithExactly(
          findMembershipStub,
          user,
          match({groupId, userId: user.id}),
      );
      assert.notCalled(repositoryDeleteStub);
      assert.notCalled(notifyStub);
    });

    it('throws CarNotFoundError if car doesn\'t exist', async function() {
      const groupId = 1;
      const carId = 1;

      const membership = {
        groupId,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      } as Membership;

      findMembershipStub.resolves(membership);

      repositoryDeleteStub.callsFake(() =>
        Promise.reject(new CarNotFoundError(groupId, carId)));

      await expect(CarService.delete(user, groupId, carId))
          .to.be.rejectedWith(CarNotFoundError);

      assert.calledOnceWithExactly(
          findMembershipStub,
          user,
          match({groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(
          repositoryDeleteStub,
          match({groupId, carId}),
      );
      assert.notCalled(notifyStub);
    });

    it('if currentUser is admin of group and car exists, delete the car and ' +
      'emit a DELETE action', async function() {
      const groupId = 1;
      const carId = 1;

      const membership = {
        groupId,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      } as Membership;

      findMembershipStub.resolves(membership);

      repositoryDeleteStub.resolves();

      await expect(CarService.delete(user, groupId, carId))
          .to.be.eventually.fulfilled;

      assert.calledOnceWithExactly(
          findMembershipStub,
          user,
          match({groupId, userId: user.id}),
      );
      assert.calledOnceWithExactly(
          repositoryDeleteStub,
          match({groupId, carId}),
      );
      assert.calledOnceWithExactly(
          notifyStub,
          groupId,
          carId,
          GroupCarAction.Delete,
          match({groupId, carId}),
      );
    });
  });
});
