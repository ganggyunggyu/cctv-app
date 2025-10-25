import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type SimplePeer from 'simple-peer';

interface SocketWithIO {
  server: HTTPServer & {
    io?: SocketIOServer;
  };
}

interface SignalData {
  roomId: string;
  signal: SimplePeer.SignalData;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (_req: NextApiRequest, res: NextApiResponse) => {
  const socketWithIO = res.socket as unknown as SocketWithIO;

  if (!socketWithIO.server.io) {
    console.log('Socket.io 서버 초기화 중...');

    const io = new SocketIOServer(socketWithIO.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`클라이언트 연결: ${socket.id}`);

      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`${socket.id} -> 룸 참가: ${roomId}`);
      });

      socket.on('offer', ({ roomId, signal }: SignalData) => {
        socket.to(roomId).emit('offer', { signal, senderId: socket.id });
        console.log(`Offer 전송: ${roomId}`);
      });

      socket.on('answer', ({ roomId, signal }: SignalData) => {
        socket.to(roomId).emit('answer', { signal, senderId: socket.id });
        console.log(`Answer 전송: ${roomId}`);
      });

      socket.on('disconnect', () => {
        console.log(`클라이언트 연결 해제: ${socket.id}`);
      });
    });

    socketWithIO.server.io = io;
  } else {
    console.log('Socket.io 서버 이미 실행 중');
  }

  res.end();
};

export default SocketHandler;
