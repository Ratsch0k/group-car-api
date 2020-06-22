/* eslint-disable @typescript-eslint/no-explicit-any */
import {fake, assert} from 'sinon';
import * as validator from 'express-validator';
import {Result} from 'express-validator';
import sinon from 'sinon';
import {expect} from 'chai';
import {InvalidRequestError} from '../../../errors';
import {createValidationResultHandler} from
  '../../../util/validation-result-handler';

const sandbox = sinon.createSandbox();

describe('LoginValidator', function() {
  afterEach(() => {
    sandbox.restore();
  });

  it('calls next if no validation errors occurred', function() {
    const requestStub: any = sandbox.stub();
    requestStub.body = {username: 'test'};
    requestStub.ip = 'TEST IP';
    const responseStub = sandbox.stub();
    const nextFake = fake();

    // Mock validation results
    const result = sandbox.createStubInstance(Result);
    result.isEmpty.returns(true);

    // Stub validationResult
    const validationResultStub = sandbox.stub(validator, 'validationResult');
    validationResultStub.withArgs(requestStub).returns(result as any);

    const loginValidationHandler =
        createValidationResultHandler(
            {debugScope: 'login:test',
              requestName: 'test',
            });
    loginValidationHandler(requestStub as any, responseStub as any, nextFake);

    assert.calledOnce(nextFake);
    sandbox.assert.calledOnce(validationResultStub);
    sandbox.assert.calledOnce(result.isEmpty);
  });

  it('throws InvalidRequestError if validation errors occurred', function() {
    const requestStub: any = sandbox.stub();
    requestStub.body = {username: 'test'};
    requestStub.ip = 'TEST IP';
    const responseStub: any = sandbox.stub();
    const nextFake = fake();

    // Mock validation results
    const result = sandbox.createStubInstance(Result);
    result.isEmpty.returns(false);

    const resultArray = [
      {
        param: 'first param',
        msg: 'first msg',
      },
      {
        param: 'second param',
        msg: 'second msg',
      },
    ];
    result.array.returns(resultArray);
    const expectedErrorMessage = 'The following fields are invalid: ' +
      `${resultArray[0].param} -> ${resultArray[0].msg}, ` +
      `${resultArray[1].param} -> ${resultArray[1].msg}`;

    // Stub validationResult
    const validationResultStub = sandbox.stub(validator, 'validationResult');
    validationResultStub.withArgs(requestStub).returns(result as any);

    const loginValidationHandler =
        createValidationResultHandler(
            {debugScope: 'login:test',
              requestName: 'test',
            });

    expect(() => loginValidationHandler(
      requestStub as any,
      responseStub as any,
      nextFake))
        .to.throw(InvalidRequestError, expectedErrorMessage)
        .with.property('validationResult', result);

    assert.notCalled(nextFake);
    sandbox.assert.calledOnce(validationResultStub);
    sandbox.assert.called(result.isEmpty);
  });
});
