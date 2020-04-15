import errorHandler from './error-handler';
import InvalidRequestError from './invalid-request-error';
import sinon, {assert} from 'sinon';
import {Result} from 'express-validator';
import {response} from 'express';

describe('ErrorHandler', () => {
  it('throws specific Error if instanceof RestError', () => {
    // Spy and stub
    const responseStub = sinon.stub(response);
    const requestSpy = sinon.spy();
    const nextSpy = sinon.spy();
    const validationResultStub = sinon.createStubInstance(Result);

    // Stub methods
    validationResultStub.isEmpty.returns(true);
    responseStub.status.returns(responseStub as any);

    // Test
    const error = new InvalidRequestError(validationResultStub as any);
    errorHandler(error,
      requestSpy as any,
      responseStub as any,
      nextSpy);

    assert.notCalled(requestSpy);
    assert.calledOnce(validationResultStub.isEmpty);
    assert.calledOnce(responseStub.status);
    assert.calledOnce(responseStub.send);
  });
});
