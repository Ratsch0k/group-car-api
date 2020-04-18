import * as config from '../config';
import {response} from 'express';
import {Result} from 'express-validator';
import sinon, {assert, match} from 'sinon';
import errorHandler from './error-handler';
import InternalError from './internal-error';
import InvalidRequestError from './invalid-request-error';
import RestError from './rest-error';

/**
 * Restore default sandbox
 */
afterEach(() => {
  sinon.restore();
});

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
    assert.calledWith(responseStub.send,
        match.instanceOf(RestError));
    assert.calledWith(responseStub.send,
        match.has('message', error.message));
    assert.calledWith(responseStub.send,
        match.has('timestamp', error.timestamp));
    assert.calledWith(responseStub.send,
        match.has('statusCode', error.statusCode));
    assert.calledWith(responseStub.send, match.has('detail', error.detail));
  });

  it('throws InternalError if not instanceof RestError', () => {
    // Spy and stub
    const responseStub = sinon.stub(response);
    const requestSpy = sinon.spy();
    const nextSpy = sinon.spy();

    // Stub methods
    responseStub.status.returns(responseStub as any);

    // Test
    const error = new Error();
    const stack = 'SOME STACK';
    error.stack = stack;
    errorHandler(error,
          requestSpy as any,
          responseStub as any,
          nextSpy);

    assert.notCalled(requestSpy);
    assert.calledOnce(responseStub.status);
    assert.calledOnce(responseStub.send);
    assert.calledWith(responseStub.send, match.instanceOf(InternalError));
    assert.calledWith(responseStub.send, match.has('stack', stack));
  });

  it('throws InternalError without stack if environment is production', () => {
    config.default.error.withStack = false;

    // Spy and stub
    const responseStub = sinon.stub(response);
    const requestSpy = sinon.spy();
    const nextSpy = sinon.spy();

    // Stub methods
    responseStub.status.returns(responseStub as any);

    // Test
    const error = new Error();
    errorHandler(error,
              requestSpy as any,
              responseStub as any,
              nextSpy);

    assert.notCalled(requestSpy);
    assert.calledOnce(responseStub.status);
    assert.calledOnce(responseStub.send);
    assert.calledWith(responseStub.send, match.instanceOf(InternalError));
    assert.calledWith(responseStub.send, match.has('stack', undefined));
  });
});
