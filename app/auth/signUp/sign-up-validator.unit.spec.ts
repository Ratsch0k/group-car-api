import sinon, {fake, assert} from 'sinon';
import {signUpRouter} from './sign-up-router';
import * as validator from 'express-validator';
import {expect} from 'chai';
import {InvalidRequestError} from '../../errors';

const sandbox = sinon.createSandbox();

describe('SignUpRouter', function() {
  afterEach(function() {
    sandbox.restore();
  });

  it('calls next if request valid', function() {
    // Create stubs
    const requestStub: any = sandbox.stub();
    requestStub.ip = 'TEST IP';
    const responseStub: any = sandbox.stub();
    const nextFake = fake();

    // Creates fake validation result
    const validationErrors = sinon.createStubInstance(validator.Result);
    validationErrors.isEmpty.returns(true);

    // Stub validator
    const validationResultStub = sandbox.stub(validator, 'validationResult');
    validationResultStub.withArgs(requestStub).returns(validationErrors as any);

    signUpRouter(requestStub, responseStub, nextFake);

    assert.calledOnce(nextFake);
  });

  it('throws InvalidRequestError if request invalid', function() {
    // Create stubs
    const requestStub: any = sandbox.stub();
    requestStub.ip = 'TEST IP';
    const responseStub: any = sandbox.stub();
    const nextFake = fake();

    // Creates fake validation result
    const validationErrors = sinon.createStubInstance(validator.Result);
    validationErrors.isEmpty.returns(false);
    const errorArray = [
      {
        param: 'first param',
        msg: 'first reason',
      },
      {
        param: 'second param',
        msg: 'second reason',
      },
    ];
    validationErrors.array.returns(errorArray);

    // Stub validator
    const validationResultStub = sandbox.stub(validator, 'validationResult');
    validationResultStub.withArgs(requestStub).returns(validationErrors as any);

    const expectedMessage = 'The following fields are invalid: ' +
      `${errorArray[0].param} -> ${errorArray[0].msg}, ` +
      `${errorArray[1].param} -> ${errorArray[1].msg}`;
    expect(() =>
      signUpRouter(requestStub, responseStub, nextFake))
        .to.throw(InvalidRequestError, expectedMessage)
        .with.property('validationResult', validationErrors);

    assert.notCalled(nextFake);
  });
});