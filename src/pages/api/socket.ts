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
      console.log(`[Server] 클라이언트 연결: ${socket.id}`);

      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`[Server] ${socket.id} -> 룸 참가: ${roomId}`);
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        console.log(`[Server] 룸 ${roomId}의 현재 클라이언트 수:`, roomSize);

        // 두 번째 클라이언트가 들어오면 첫 번째 클라이언트(Capture)에게 알림
        if (roomSize === 2) {
          socket.to(roomId).emit('viewer-joined');
          console.log(`[Server] 룸 ${roomId}에 viewer-joined 이벤트 전송`);
        }
      });

      socket.on('offer', ({ roomId, signal }: SignalData) => {
        console.log(`[Server] Offer 수신 from ${socket.id} -> 룸 ${roomId}`);
        console.log(
          `[Server] 룸 ${roomId}에 있는 다른 클라이언트에게 전송 중...`
        );
        socket.to(roomId).emit('offer', { signal, senderId: socket.id });
        console.log(`[Server] Offer 전송 완료`);
      });

      socket.on('answer', ({ roomId, signal }: SignalData) => {
        console.log(`[Server] Answer 수신 from ${socket.id} -> 룸 ${roomId}`);
        socket.to(roomId).emit('answer', { signal, senderId: socket.id });
        console.log(`[Server] Answer 전송 완료`);
      });

      socket.on('disconnect', () => {
        console.log(`[Server] 클라이언트 연결 해제: ${socket.id}`);
      });
    });

    socketWithIO.server.io = io;
  } else {
    console.log('Socket.io 서버 이미 실행 중');
  }

  res.end();
};

export default SocketHandler;
