import socketIo, {Socket} from 'socket.io';
import debug from 'debug';
import {Car} from '@models';
import {wrapSocketMiddleware} from '@app/util/socket-middleware-wrapper';
import cookieParser from 'cookie-parser';
import {NextFunction, Request, Response} from 'express';
import {MembershipService} from '@app/models';
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

  /**
   * An existing car is deleted.
   */
  Delete = 'delete'
}

/**
 * Logger.
 */
const log = debug('group-car:group:notification');

/**
 * Logger for logging socket details.
 */
const ioLog = debug('group-car:socket');

/**
 * Namespace which is used for groups.
 */
let nsp: socketIo.Namespace;

/**
 * Socket.io server instance.
 */
let io: socketIo.Server;

/**
 * Notification service for group actions.
 */
export const GroupNotificationService = {
  /**
   * Setter of io server.
   * @param _io - io server
   */
  setIo(_io: socketIo.Server): void {
    io = _io;
    nsp = io.of(/^\/group\/\w+/);
    nsp.use(this.logConnection.bind(this));
    nsp.use(wrapSocketMiddleware(cookieParser() as never));
    nsp.use((socket, next) => {
      wrapSocketMiddleware((() => {
        return (req: Request, res: Response, next: NextFunction) => {
          /*
           * Override res.cookie to throw an error.
           * We can expect that thw jwtMiddleware will only
           * call this if it tries to set the jwt cookie.
           * This should only happen if either the client didn't
           * provide the cookie or if the cookie has expired.
           */
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          res.cookie = function() {
            ioLog('Client %s is missing jwt', socket.client.id);
            next(new UnauthorizedError('Missing credentials'));
            return this;
          };
          try {
          } catch (e) {
            ioLog('Error in jwt csrf middleware: ', e);
            next(new InternalError());
          }
        };
      })())(socket, next);
    });
    nsp.use(this.checkUserAuthorization);
    nsp.on('connection', (socket) => {
      ioLog(
          'Client %s successfully connected to namespace %s',
          socket.client.id,
          socket.nsp.name,
      );
    });
  },

  /**
   * Logs the connection of the socket.
   * @param socket  - The socket
   * @param next    - Next function
   */
  logConnection(socket: Socket, next: NextFunction): void {
    ioLog(
        'Client %s connecting to namespace %s',
        socket.client.id,
        socket.nsp.name,
    );

    next();
  },

  /**
   * Checks if the client is authorized to access the request group.
   * @param socket  - The socket with client information
   * @param next    - Next function
   */
  async checkUserAuthorization(
      socket: Socket,
      next: NextFunction,
  ): Promise<void> {
    // Get groupId from namespace
    const groupId = parseInt(socket.nsp.name.replace('/group/', ''), 10);

    if (isNaN(groupId)) {
      next(new InternalError('Couldn\'t parse namespace'));
    }

    if (await MembershipService.isMember(socket.request.user, groupId)) {
      next();
    } else {
      next(new NotMemberOfGroupError());
    }
  },

  /**
   * Notifies namespace of the specified group to the specified updateö
   * @param groupId   - The id of the group
   * @param carId     - The id of the cdar
   * @param type      - The type of update
   * @param car       - Data of the car
   */
  notifyCarUpdate(
      groupId: number,
      carId: number,
      type: GroupCarAction,
      car: Car,
  ): void {
    log('Notify nsp %s with update to car %d', `/group/${groupId}`, carId);

    io.of(`/group/${groupId}`).emit('update', {action: type, car});
  },
};

export default GroupNotificationService;
