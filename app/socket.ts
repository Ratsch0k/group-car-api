import http from 'http';
import socketIo, {Server} from 'socket.io';
import {GroupNotificationService} from '@models';

/**
 * Initialize everything socket.io related.
 * @param server - The used http server
 */
const initSocketIoServer = (server: http.Server): Server => {
  const io = socketIo(server, {serveClient: false, path: '/socket'});

  GroupNotificationService.setIo(io);

  return io;
};

export default initSocketIoServer;
