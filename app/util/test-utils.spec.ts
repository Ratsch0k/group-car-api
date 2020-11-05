/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import app from '../app';
import config from '../config';
import initSocketIoServer from '../socket';
import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import ioClient from 'socket.io-client';

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
          return this.extractJwtValue(response.header['set-cookie']);
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

  /**
   * Extract the value of the jwt cookie from a set-cookie header.
   * @param setCookie - The string of the set-cookie header
   */
  public static extractJwtValue(setCookie: string[]): string {
    const jwtCookie = setCookie.find((el) => el.includes('jwt='));
    if (!jwtCookie) {
      throw new Error('Cannot extract jwt cookie');
    }
    return jwtCookie.split(';')[0].replace('jwt=', '');
  }

  /**
   * Creates a socket with the specified port to the specified namespace.
   * @param port  - The port to the socket server
   * @param nsp   - The namespace
   * @param jwt   - Value for the jwt cookie
   */
  public static createSocket(
      port: number,
      nsp: string,
      jwt: string,
  ): SocketIOClient.Socket {
    return ioClient(`http://127.0.0.1:${port}${nsp}`, {
      forceNew: true,
      reconnectionDelay: 0,
      path: '/socket',
      transportOptions: {
        polling: {
          extraHeaders: {
            'Cookie': 'jwt=' + jwt,
          },
        },
      },
    });
  }
}
