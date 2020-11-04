import socketIo, {Socket} from 'socket.io';
import debug from 'debug';
import {Car} from '@models';
import {wrapSocketMiddleware} from '@app/util/socket-middleware-wrapper';
import cookieParser from 'cookie-parser';
import jwtCsrf from '@app/routes/auth/jwt/jwt-csrf';
import expressJwt from 'express-jwt';
import config from '@app/config';
import {postLoginJwtValidator} from '@app/routes/auth/jwt/jwt-util';
import {NextFunction, Request, Response} from 'express';
import {MembershipService} from '../membership';
import {
  InternalError,
  NotMemberOfGroupError,
  UnauthorizedError,
} from '@app/errors';

/**
 * Types of updates to the cars of the group.
 */
export enum GroupCarAction {
  /**
   * A car has been parked.
   */
  Park = 'park',
  /**
   * A client drives a car.
   */
  Drive = 'drive',
  /**
   * A new car is added to the group.
   */
  Add = 'add',
}

/**
 * Notification service for group actions.
 */
export class GroupNotificationService {
  /**
   * Logger.
   */
  private static readonly log = debug('group-car:group:notification');

  /**
   * Logger for logging socket details.
   */
  private static readonly ioLog = debug('group-car:socket');

  /**
   * Namespace which is used for groups.
   */
  private static nsp: socketIo.Namespace;

  /**
   * Socket.io server instance.
   */
  private static io: socketIo.Server;

  /**
   * Setter of io server.
   * @param io - io server
   */
  static setIo(io: socketIo.Server): void {
    this.io = io;
    this.nsp = io.of(/^\/group\/\w+/);
    this.nsp.use(this.logConnection.bind(this));
    this.nsp.use(wrapSocketMiddleware(cookieParser()));
    this.nsp.use((socket, next) => {
      wrapSocketMiddleware((() => {
        const jwtMiddleware = jwtCsrf();

        return (req: Request, res: Response, next: NextFunction) => {
          /*
           * Override res.cookie to throw an error.
           * We can expect that thw jwtMiddleware will only
           * call this if it tries to set the jwt cookie.
           * This should only happen if either the client didn't
           * provide the cookie or if the cookie has expired.
           */
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const self = this;
          res.cookie = function() {
            self.ioLog('Client %s is missing jwt', socket.client.id);
            next(new UnauthorizedError('Missing credentials'));
            return this;
          };
          try {
            jwtMiddleware(req, res, next);
          } catch (e) {
            this.ioLog('Error in jwt csrf middleware: ', e);
            next(new InternalError());
          }
        };
      })())(socket, next);
    });
    this.nsp.use(wrapSocketMiddleware(expressJwt({
      secret: config.jwt.secret,
      getToken: config.jwt.getToken,
      requestProperty: 'auth',
      algorithms: ['HS512'],
    })));
    this.nsp.use(wrapSocketMiddleware(postLoginJwtValidator));
    this.nsp.use(this.checkUserAuthorization);
    this.nsp.on('connection', (socket) => {
      this.ioLog(
          'Client %s successfully connected to namespace %s',
          socket.client.id,
          socket.nsp.name,
      );
    });
  }

  /**
   * Logs the connection of the socket.
   * @param socket  - The socket
   * @param next    - Next function
   */
  private static logConnection(socket: Socket, next: NextFunction) {
    this.ioLog(
        'Client %s connecting to namespace %s',
        socket.client.id,
        socket.nsp.name,
    );

    next();
  }

  /**
   * Checks if the client is authorized to access the request group.
   * @param socket  - The socket with client information
   * @param next    - Next function
   */
  private static async checkUserAuthorization(
      socket: Socket,
      next: NextFunction,
  ): Promise<void> {
    // Get groupId from namespace
    const groupId = parseInt(socket.nsp.name.replace('/group/', ''));

    if (isNaN(groupId)) {
      next(new InternalError('Couldn\'t parse namespace'));
    }

    if (await MembershipService.isMember(socket.request.user, groupId)) {
      next();
    } else {
      next(new NotMemberOfGroupError());
    }
  }

  /**
   * Notifies namespace of the specified group to the specified updateö
   * @param groupId   - The id of the group
   * @param carId     - The id of the cdar
   * @param type      - The type of update
   * @param car       - Data of the car
   */
  static notifyCarUpdate(
      groupId: number,
      carId: number,
      type: GroupCarAction,
      car: Car,
  ): void {
    this.log('Notify nsp %s with update to car %d', `/group/${groupId}`, carId);

    this.io.of(`/group/${groupId}`).emit('update', {action: type, car});
  }
}

export default GroupNotificationService;
