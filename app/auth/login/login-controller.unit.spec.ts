import mocha = require('mocha');
import chai = require('chai');
const loginController = require('./login-controller');

mocha.describe('LoginController', () => {
  mocha.it('should return false', () => {
    chai.expect(loginController('username', 'password')).to.equal(false);
  });
});
