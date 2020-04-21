import {Result} from 'express-validator';
import sinon, {match} from 'sinon';
import * as config from '../config';
import errorHandler from './error-handler';
import InternalError from './internal-error';
import InvalidRequestError from './invalid-request-error';
import RestError from './rest-error';

const sandbox = sinon.createSandbox();

describe('ErrorHandler', () => {
  /**
   * Restore default sandbox
   */
  afterEach(() => {
    sandbox.restore();
  });

  it('throws specific Error if instanceof RestError', () => {
    // Spy and stub
    const responseStub: any = sandbox.stub();
    const requestStub: any = sandbox.stub();
    const nextStub = sinon.stub();
    const validationResultStub: any = sandbox.createStubInstance(Result);

    // Stub methods
    validationResultStub.isEmpty.returns(true);
    responseStub.status = sandbox.stub().returns(responseStub);
    responseStub.send = sandbox.stub();

    // Test
    const error = new InvalidRequestError(validationResultStub);

    errorHandler(error, requestStub, responseStub, nextStub);

    sandbox.assert.notCalled(requestStub);
    sandbox.assert.calledOnce(validationResultStub.isEmpty);
    sandbox.assert.calledOnce(responseStub.status);
    sandbox.assert.calledOnce(responseStub.send);
    sandbox.assert.calledWith(responseStub.send,
        match.instanceOf(RestError));
    sandbox.assert.calledWith(responseStub.send,
        match.has('message', error.message));
    console.dir(error);
    console.dir(responseStub.send.args[0]);
    console.dir(responseStub.send.args[0].timestamp);
    sandbox.assert.calledWith(responseStub.send,
        match.has('timestamp', match.date));
    sandbox.assert.calledWith(responseStub.send,
        match.has('statusCode', error.statusCode));
    sandbox.assert.calledWith(responseStub.send,
        match.has('detail', error.detail));
  });

  it('throws InternalError if not instanceof RestError', () => {
    // Spy and stub
    const responseStub: any = sandbox.stub();
    const requestStub: any = sandbox.stub();
    const nextStub: any = sandbox.stub();

    // Stub methods
    responseStub.status = sandbox.stub().returns(responseStub);
    responseStub.send = sandbox.stub();

    // Test
    const error = new Error();
    const stack = 'SOME STACK';
    error.stack = stack;

    errorHandler(error, requestStub, responseStub, nextStub);

    sandbox.assert.notCalled(requestStub);
    sandbox.assert.calledOnce(responseStub.status);
    sandbox.assert.calledOnce(responseStub.send);
    sandbox.assert.calledWith(responseStub.send,
        match.instanceOf(InternalError));
    sandbox.assert.calledWith(responseStub.send,
        match.has('stack', stack));
  });

  it('throws InternalError without stack if environment is production', () => {
    config.default.error.withStack = false;

    // Spy and stub
    const responseStub: any = sandbox.stub();
    const requestStub: any = sandbox.stub();
    const nextStub: any = sandbox.stub();

    // Stub methods
    responseStub.status = sandbox.stub().returns(responseStub);
    responseStub.send = sandbox.stub();

    // Test
    const error = new Error();

    errorHandler(error, requestStub, responseStub, nextStub);

    sandbox.assert.notCalled(requestStub);
    sandbox.assert.calledOnce(responseStub.status);
    sandbox.assert.calledOnce(responseStub.send);
    sandbox.assert.calledWith(responseStub.send,
        match.instanceOf(InternalError));
    sandbox.assert.calledWith(responseStub.send, match.has('stack', undefined));
  });
});
