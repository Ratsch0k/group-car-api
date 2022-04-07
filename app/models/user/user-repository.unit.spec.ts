/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert} from 'sinon';
import {ProfilePic, User} from '../../models';
import {expect} from 'chai';
import {UserRepository} from './user-repository';
import sequelize, {Transaction} from 'sequelize';
import {ProfilePictureNotFoundError, UserNotFoundError} from '../../errors';
import {RepositoryQueryOptions} from '../../../typings';
const Op = sequelize.Op;

describe('UserRepository', function() {
  let userFindAllStub: sinon.SinonStub<any, any>;

  beforeEach(function() {
    userFindAllStub = sinon.stub(User, 'findAll');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('findLimitedWithFilter', function() {
    it('throws TypeError if startsWith is not a string', async function() {
      const startsWith = 123;
      const limit = 10;

      await expect(UserRepository.findLimitedWithFilter(
        startsWith as any,
        limit,
      ))
          .to.be.eventually.rejectedWith(TypeError);

      assert.notCalled(userFindAllStub);
    });

    it('throws TypeError if limit is not a number', async function() {
      const startsWith = 'test';
      const limit = '123';

      await expect(UserRepository.findLimitedWithFilter(
          startsWith,
         limit as any,
      ))
          .to.be.eventually.rejectedWith(TypeError);

      assert.notCalled(userFindAllStub);
    });

    it('calls User.findAll with correct parameters', async function() {
      const startsWith = 'test';
      const limit = 10;

      const users = [
        {
          id: 1,
          username: 'test1',
        },
        {
          id: 2,
          username: 'test2',
        },
        {
          id: 3,
          username: 'test3',
        },
      ];

      userFindAllStub.resolves(users as any);

      const options = {
        transaction: {},
      };

      const actual = await expect(UserRepository.findLimitedWithFilter(
          startsWith,
         limit as any,
         options as any,
      ))
          .to.be.fulfilled;

      expect(actual).to.be.equal(users);

      assert.calledOnce(userFindAllStub);

      const parameter = userFindAllStub.firstCall.args[0];
      expect(parameter).to.exist;

      const expectedParameter: any = {
        where: {
          [Op.and]: [
            {
              deletedAt: {
                [Op.is]: null,
              },
              username: {
                [Op.startsWith]: startsWith,
              },
            },
          ],
        },
        order: [['username', 'ASC']],
        attributes: User.simpleAttributes,
        limit,
        transaction: options.transaction,
      };

      expect(parameter).to.be.eql(expectedParameter);
    });
  });

  describe('findById', function() {
    let userStub: sinon.SinonStub;

    beforeEach(function() {
      userStub = sinon.stub(User, 'findByPk');
    });

    it('throws UserNotFoundError if not user is found', async function() {
      userStub.resolves(null);
      const id = 2;

      await expect(
          UserRepository.findById(id),
      ).to.eventually.be.rejectedWith(UserNotFoundError);

      assert.calledOnceWithExactly(userStub, id, undefined);
    });

    it('returns the user', async function() {
      const id = 2;
      const user = {
        id,
        username: 'TEST',
      };
      userStub.resolves(user);

      await expect(
          UserRepository.findById(id),
      ).to.eventually.eql(user);

      assert.calledOnceWithExactly(userStub, id, undefined);
    });

    it('forwards the given options to the database query', async function() {
      const id = 2;
      const user = {
        id,
        username: 'TEST',
      };
      userStub.resolves(user);
      const options: Partial<RepositoryQueryOptions> = {
        transaction: 5 as unknown as Transaction,
      };

      await expect(
          UserRepository.findById(id, options),
      ).to.eventually.eql(user);

      assert.calledOnceWithExactly(userStub, id, options);
    });
  });

  describe('findProfilePictureById', function() {
    let pbFindByPkStub: sinon.SinonStub;

    beforeEach(function() {
      pbFindByPkStub = sinon.stub(ProfilePic, 'findByPk');
    });

    it('calls ProfilePic.findByPk with correct arguments', async function() {
      const fakePB = 'TEST';
      const userId = 10;
      const options = {
        transaction: 'T',
      };

      pbFindByPkStub.resolves(fakePB);

      const actual = await UserRepository.findProfilePictureById(
          userId,
          options as any,
      );

      expect(actual).to.eq(fakePB);

      assert.calledOnceWithExactly(
          pbFindByPkStub,
          userId,
          sinon.match({transaction: options.transaction}),
      );
    });

    it('throws ProfilePictureNotFoundError if no profile ' +
      'picture found', async function() {
      const fakePB = null;
      const userId = 10;

      pbFindByPkStub.resolves(fakePB);

      await expect(UserRepository.findProfilePictureById(userId))
          .to.be.eventually.be.rejectedWith(ProfilePictureNotFoundError);

      assert.calledOnceWithExactly(
          pbFindByPkStub,
          userId,
          sinon.match.any,
      );
    });
  });
});
