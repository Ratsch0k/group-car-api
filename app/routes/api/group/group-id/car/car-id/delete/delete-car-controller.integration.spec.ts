import {
  TestContext,
  TestUtils,
} from '../../../../../../../util/test-utils.spec';
import supertest, {agent as unauthorizedAgent} from 'supertest';
import app from '../../../../../../../app';
import {expect} from 'chai';
import {
  CarNotFoundError,
  NotAdminOfGroupError,
  NotMemberOfGroupError,
} from '../../../../../../../errors';
import {
  CarColor,
  CarRepository,
  Group,
  Membership,
  User,
} from '../../../../../../../models';

describe('delete /api/group/:groupId/car/:carId', function() {
  /**
   * Creates the url to delete the car of the group.
   * @param groupId - Group ID
   * @param carId - Car ID
   */
  function createUrl(groupId: number, carId: number) {
    return `/api/group/${groupId}/car/${carId}`;
  }

  /**
   * Creates a test group and its owner.
   *
   * @returns The test group and its owner
   */
  async function setupTestGroup() {
    // Create other user which will be owner of test group
    const owner = await User.create({
      username: 'OWNER',
      email: 'OWNER@MAIL.COM',
      password: 'OWNER_PASSWORD',
      isBetaUser: false,
    });

    // Create test group
    const group = await Group.create({
      name: 'TEST_GROUP',
      ownerId: owner.id,
    });

    return {group, owner};
  }

  let agent: supertest.SuperAgentTest;
  let user: TestContext['user'];

  beforeEach(async function() {
    ({agent, user} = await TestUtils.setupIntegrationTest());
  });

  it('rejects with UnauthorizedError if user is not logged in', function() {
    return unauthorizedAgent(app)
        .delete(createUrl(1, 1))
        .send()
        .expect(401);
  });

  describe('rejects with BadRequestError if ', function() {
    describe('groupId ', function() {
      it('is not parseable as an integer', function() {
        return agent
            .delete(createUrl('NOT_THE_GROUP_ID' as unknown as number, 42))
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.include('groupId has to be a number');
            });
      });
    });

    describe('carId ', function() {
      it('is not parseable as an integer', function() {
        return agent
            .delete(createUrl(42, 'NOT_THE_CAR_ID' as unknown as number))
            .send()
            .expect(400)
            .then((res) => {
              expect(res.body.message).to.include('carId has to be a number');
            });
      });
    });
  });

  it('if the group doesn\'t exist, ' +
    'reject with NotMemberOfGroupError', function() {
    return agent
        .delete(createUrl(1, 1))
        .send()
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .eql(new NotMemberOfGroupError().message);
          expect(res.body.detail.errorName).to
              .eql(NotMemberOfGroupError.name);
        });
  });

  it('if the user is not a member of the group, ' +
    'reject with NotMemberOfGroupError', async function() {
    const {group} = await setupTestGroup();

    return agent
        .delete(createUrl(group.id, 1))
        .send()
        .expect(401)
        .then((res) => {
          expect(res.body.message).to
              .eql(new NotMemberOfGroupError().message);
          expect(res.body.detail.errorName).to.
              eql(NotMemberOfGroupError.name);
        });
  });

  it('if the user is a member of the group but not an admin, ' +
    'reject with NotAdminOfGroupError', async function() {
    const {group} = await setupTestGroup();

    // Make the user a member but not an admin of that group
    await Membership.create({
      userId: user.id,
      groupId: group.id,
      isAdmin: false, // Important that user is not an admin
    });

    // Test if admin check is correct
    await agent
        .delete(createUrl(group.id, 1))
        .send()
        .expect(401)
        .then((res) => {
          expect(res.body.message).to.eql(new NotAdminOfGroupError().message);
          expect(res.body.detail.errorName).to.eql(NotAdminOfGroupError.name);
        });
  });

  it('if the user is an admin of the group but the car doesn\'t exist, ' +
    'reject with CarNotFoundError', async function() {
    const {group} = await setupTestGroup();

    // Make the user admin of group
    await Membership.create({
      userId: user.id,
      groupId: group.id,
      isAdmin: true, // Important that user is admin of the group
    });

    // Test if admin check is correct
    await agent
        .delete(createUrl(group.id, 1))
        .send()
        .expect(404)
        .then((res) => {
          expect(res.body.message).to
              .eql(new CarNotFoundError(group.id, 1).message);
          expect(res.body.detail.errorName).to.eql(CarNotFoundError.name);
        });
  });

  it('if the user is an admin of the group and the car exists, ' +
    'delete the car and respond with an empty message and ' +
    'status code 204', async function() {
    const {group} = await setupTestGroup();

    // Make the user admin of group
    await Membership.create({
      userId: user.id,
      groupId: group.id,
      isAdmin: true, // Important that user is admin of the group
    });

    // Create car to test deletion
    const car = await CarRepository.create(group.id, 'TEST_CAR', CarColor.Blue);

    await agent
        .delete(createUrl(group.id, car.carId))
        .send()
        .expect(204)
        .then((res) => {
          expect(res.body.message).to.be.undefined;
        });
  });
});
