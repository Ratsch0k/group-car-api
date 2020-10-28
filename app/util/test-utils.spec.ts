/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import app from '../app';
import config from '../config';

export interface SignUpReturn {
  user: any;
  csrf: string;
  agent: request.SuperTest<request.Test>;
  signUpBody: {
    username: string;
    password: string;
    email: string;
  };
}

const csrfHeaderName = config.jwt.securityOptions.tokenName.toLowerCase();

/**
 * Util class for tests.
 */
export class TestUtils {
  /**
   * Creates a test user and signs in.
   */
  public static async signUp(): Promise<SignUpReturn> {
    const agent = request.agent(app);

    const signUpBody = {
      username: 'test',
      email: 'test@mail.com',
      password: 'password',
    };

    let user: any;

    // Get csrf token
    let csrf = await agent.head('/auth')
        .then((response) => {
          // Save jwt cookie
          return response.header[csrfHeaderName];
        });

    console.log('GOT CSRF TOKEN');

    // Sign up to access api and set new jwt
    await agent
        .post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send(signUpBody)
        .expect(201)
        .then((response) => {
          user = response.body;
        });
    console.log('SIGNED UP');

    csrf = await agent.head('/auth')
        .then((response) => {
          // Save jwt cookie
          return response.header[csrfHeaderName];
        });

    console.log('GOT CSRF TOKEN AGAIN');

    return {
      user,
      csrf,
      agent,
      signUpBody,
    };
  }
}
