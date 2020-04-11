import mocha = require('mocha');
import chai = require('chai');
const loginController = require('src/controller/loginController');

mocha.describe('LoginController', () => {
  mocha.it('should return false', () => {
    chai.expect(loginController('username', 'password')).to.equal(false);
  });
});
