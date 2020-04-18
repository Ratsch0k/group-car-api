import {loginRouter} from './login-router';
import {stub, fake, assert} from 'sinon';
import {request, response} from 'express';
import * as validator from 'express-validator';
import {Result} from 'express-validator';
import sinon from 'sinon';
import {expect} from 'chai';
import {InvalidRequestError} from '../../errors';

describe('LoginRouter', function() {
  it('calls next if no validation errors occurred', function() {
    const requestStub = stub(request);
    requestStub.body = {username: 'test'};
    stub(requestStub, 'ip').get(() => 'TEST IP');
    const responseStub = stub(response);
    const nextFake = fake();

    // Mock validation results
    const result = sinon.createStubInstance(Result);
    result.isEmpty.returns(true);

    // Stub validationResult
    const validationResultStub = stub(validator, 'validationResult');
    validationResultStub.withArgs(requestStub).returns(result as any);

    loginRouter(requestStub as any, responseStub as any, nextFake);

    assert.calledOnce(nextFake);
    assert.calledOnce(validationResultStub);
    assert.calledOnce(result.isEmpty);
  });

  it('throws InvalidRequestError if validation errors occurred', function() {
    const requestStub = stub(request);
    requestStub.body = {username: 'test'};
    stub(requestStub, 'ip').get(() => 'TEST IP');
    const responseStub = stub(response);
    const nextFake = fake();

    // Mock validation results
    const result = sinon.createStubInstance(Result);
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
    const validationResultStub = stub(validator, 'validationResult');
    validationResultStub.withArgs(requestStub).returns(result as any);

    expect(() => loginRouter(requestStub as any, responseStub as any, nextFake))
        .to.throw(InvalidRequestError, expectedErrorMessage)
        .with.property('validationResult', result);

    assert.notCalled(nextFake);
    assert.calledOnce(validationResultStub);
    assert.called(result.isEmpty);
  });
});
