import http from 'http';
import socketIo, {Server} from 'socket.io';
import {GroupNotificationService} from '@models';

const initSocketIoServer = (server: http.Server): Server => {
  const io = socketIo(server, {serveClient: false, path: '/socket'});

  GroupNotificationService.setIo(io);

  return io;
};

export default initSocketIoServer;
