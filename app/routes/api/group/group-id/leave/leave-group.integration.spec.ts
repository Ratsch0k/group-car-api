import {syncPromise} from '../../../../../db';
import {TestUtils} from '../../../../../util/test-utils.spec';
import request from 'supertest';
import sinon from 'sinon';
import db from '../../../../../db';
import config from '../../../../../config/config';
import {expect} from 'chai';

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();


describe('LeaveGroup', function() {
  let agent: request.SuperTest<request.Test>;
  //let user: any;
  let csrf: string;

  beforeEach(async function() {
    await syncPromise;
    await db.sync({force: true});

    const response = await TestUtils.signUp();

    agent = response.agent;
    //user = response.user;
    csrf = response.csrf;
  });

  afterEach(function() {
    sinon.restore();
  });

  it('responses with OwnerCannotLeaveError if owner ' +
  'of group tries to leave it', async function() {
    // Create group
    const group = await agent.post('/api/group')
        .set(csrfHeaderName, csrf)
        .send({
          name: 'NAME',
          description: 'DESC',
        })
        .expect(201)
        .then((res) => res.body);

    // Try to leave that group
    await agent.post(`/api/group/${group.id}/leave`)
        .set(csrfHeaderName, csrf)
        .expect(400)
        .then((res) => {
          expect(res.body.message).to
              .contain('An owner can\'t leave a group. ' +
              'Transfer your ownership to do so');
        });
  });

  it('leaves the group');

  it('response with UnauthorizedError if user tries to leave ' +
  'a group he/she is not a member of', function() {
    // Try to leave that group
    return agent.post(`/api/group/1/leave`)
        .expect(401);
  });
});
