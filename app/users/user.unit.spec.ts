import {hashPasswordOfUser} from './user';
import bcrypt from 'bcrypt';
import {stub, match, assert} from 'sinon';
import {expect} from 'chai';
import * as config from '../config';
import PasswordNotHashableError from './password-not-hashable-error';

type User = import('./user').default;

describe('User model', function() {
  describe('hashPasswordOfUser', function() {
    it('can hash string', function() {
      const password = '1234';
      const fakeUser = {
        password,
      };

      // Overwrite saltRounds in config
      const saltRounds = 2;
      config.default.bcrypt.saltRounds = saltRounds;

      const fakeHash = 'some hash';
      const hashStub = stub(bcrypt)
          .hash
          .withArgs(match.string, saltRounds)
          .resolves(fakeHash);

      return hashPasswordOfUser(fakeUser as User).then(() => {
        expect(fakeUser.password).to.equal(fakeHash);
        assert.calledOnce(hashStub);
        assert.calledWith(hashStub, password, saltRounds);
      });
    });

    it('can hash number', function() {
      const password = 1234;
      const fakeUser = {
        password,
      };

      // Overwrite saltRounds in config
      const saltRounds = 2;
      config.default.bcrypt.saltRounds = saltRounds;

      const fakeHash = 'some hash';
      const hashStub = stub(bcrypt)
          .hash
          .withArgs(match.string, match.number)
          .resolves(fakeHash);

      return hashPasswordOfUser(fakeUser as unknown as User).then(() => {
        expect(fakeUser.password).to.equal(fakeHash);
        assert.calledOnce(hashStub);
        assert.calledWith(hashStub, password.toString(), saltRounds);
      });
    });

    it('throws PasswordNotHashableError if bcrypt can\'t hash', function() {
      const fakeUser = {
        username: 'demo',
        password: 1234,
      };

      const expectedMessage =
        `Couldn't hash the password for user ${fakeUser.username}`;

      // Overwrite saltRounds in config
      const saltRounds = 2;
      config.default.bcrypt.saltRounds = saltRounds;

      const hashStub = stub(bcrypt, 'hash')
          .withArgs(match.string, match.number)
          .rejects();

      return hashPasswordOfUser(fakeUser as unknown as User).catch((error) => {
        expect(fakeUser.password).to.equal(fakeUser.password);
        assert.calledOnce(hashStub);
        assert.calledWith(hashStub, fakeUser.password.toString(), saltRounds);
        expect(error).to.be.
            instanceOf(PasswordNotHashableError, expectedMessage)
            .with.property('user', fakeUser.username);
      });
    });
  });
});
