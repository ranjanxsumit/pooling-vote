import type { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setIO = (io: SocketIOServer) => {
  ioInstance = io;
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) throw new Error('Socket.IO not initialized');
  return ioInstance;
};
