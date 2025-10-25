import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any).server.io) {
    console.log('Socket.io 서버 초기화 중...');

    const httpServer = (res.socket as any).server as HTTPServer;
    const io = new SocketIOServer(httpServer, {
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

      socket.on('offer', (data: { roomId: string; signal: any }) => {
        const { roomId, signal } = data;
        socket.to(roomId).emit('offer', { signal, senderId: socket.id });
        console.log(`Offer 전송: ${roomId}`);
      });

      socket.on('answer', (data: { roomId: string; signal: any }) => {
        const { roomId, signal } = data;
        socket.to(roomId).emit('answer', { signal, senderId: socket.id });
        console.log(`Answer 전송: ${roomId}`);
      });

      socket.on('ice-candidate', (data: { roomId: string; candidate: any }) => {
        const { roomId, candidate } = data;
        socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
      });

      socket.on('disconnect', () => {
        console.log(`클라이언트 연결 해제: ${socket.id}`);
      });
    });

    (res.socket as any).server.io = io;
  } else {
    console.log('Socket.io 서버 이미 실행 중');
  }

  res.end();
};

export default SocketHandler;
