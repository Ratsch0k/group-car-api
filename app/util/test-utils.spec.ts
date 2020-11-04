/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import app from '../app';
import config from '../config';
import initSocketIoServer from '../socket';
import express from 'express';
import http from 'http';
import {Server} from 'socket.io';

export interface SignUpReturn {
  user: any;
  csrf: string;
  agent: request.SuperTest<request.Test>;
  signUpBody: {
    username: string;
    password: string;
    email: string;
  };
  jwtValue: string;
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

    // Sign up to access api and set new jwt
    const jwtValue = await agent
        .post('/auth/sign-up')
        .set(csrfHeaderName, csrf)
        .send(signUpBody)
        .expect(201)
        .then((response) => {
          user = response.body;
          const jwtCookie = response.header['set-cookie'][0] as string;
          return jwtCookie.split(';')[0].replace('jwt=', '');
        });

    csrf = await agent.head('/auth')
        .then((response) => {
          // Save jwt cookie
          return response.header[csrfHeaderName];
        });


    return {
      user,
      csrf,
      agent,
      signUpBody,
      jwtValue,
    };
  }

  /**
   * Starts a test instance of the socket.io server.
   * Creates an empty express app, a server instance
   * and then initialize socket.io.
   */
  public static startSocketIo(): Promise<{port: number, io: Server}> {
    return new Promise((resolve, reject) => {
      const app = express();
      const server = http.createServer(app);
      const io = initSocketIoServer(server);
      const port = 9999;
      server.listen(port);
      server.on('listening', () => resolve({port, io}));
      server.on('error', (e) => {
        reject(e);
      });
    });
  }
}
