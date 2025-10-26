'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { cn } from '@/shared';

interface ViewerModeProps {
  roomId: string;
  onBack: () => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const ViewerMode = ({ roomId, onBack }: ViewerModeProps) => {
  const [status, setStatus] = React.useState('대기 중...');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const peerRef = React.useRef<SimplePeer.Instance | null>(null);

  React.useEffect(() => {
    const initViewer = async () => {
      setStatus('Socket.io 서버 초기화 중...');
      console.log('[Viewer] Socket.io 엔드포인트 호출 시작');
      const initRes = await fetch('/api/socket');
      console.log('[Viewer] Socket.io 엔드포인트 응답:', initRes.status);

      setStatus('Socket.io 연결 중...');
      console.log('[Viewer] Socket.io 클라이언트 연결 시작');
      const socket = io('/', { path: '/api/socket' });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Viewer] Socket.io 연결 성공! ID:', socket.id);
        setStatus(`룸 참가 중: ${roomId}`);
        socket.emit('join-room', roomId);
        console.log('[Viewer] 룸 참가 요청:', roomId);
      });

      socket.on('offer', ({ signal }: { signal: SimplePeer.SignalData }) => {
        console.log('[Viewer] Offer 수신');
        setStatus('Peer 연결 중...');

        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          config: { iceServers: ICE_SERVERS },
        });

        peerRef.current = peer;

        peer.on('signal', (answerSignal) => {
          console.log('[Viewer] Answer 생성, 전송 중');
          socket.emit('answer', { roomId, signal: answerSignal });
        });

        peer.on('stream', (stream) => {
          console.log('[Viewer] 스트림 수신 성공!');
          setStatus('스트림 수신 성공!');
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        });

        peer.on('connect', () => {
          console.log('[Viewer] P2P 연결 성공!');
          setStatus('P2P 연결 성공!');
        });

        peer.on('error', ({ message }) => {
          console.error('[Viewer] Peer error:', message);
          setStatus(`에러: ${message}`);
        });

        peer.signal(signal);
      });

      socket.on('disconnect', () => {
        console.log('[Viewer] Socket.io 연결 끊김');
        setStatus('연결 끊김');
      });
    };

    initViewer();

    return () => {
      console.log('[Viewer] Cleanup 실행');
      peerRef.current?.destroy();
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div className={cn('min-h-screen bg-gray-900 flex flex-col')}>
      <div className={cn('bg-gray-800 p-4 border-b border-gray-700')}>
        <div className={cn('max-w-7xl mx-auto flex items-center justify-between')}>
          <div>
            <h2 className={cn('text-xl font-bold text-white')}>뷰어 모드</h2>
            <p className={cn('text-sm text-gray-400')}>룸: {roomId}</p>
          </div>
          <button
            onClick={onBack}
            className={cn(
              'px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors'
            )}
          >
            뒤로가기
          </button>
        </div>
      </div>

      <div className={cn('flex-1 flex flex-col items-center justify-center p-4')}>
        <div className={cn('w-full max-w-4xl space-y-4')}>
          <div className={cn('bg-gray-800 rounded-lg p-4')}>
            <p className={cn('text-center text-white')}>{status}</p>
          </div>

          <div className={cn('relative bg-black rounded-lg overflow-hidden aspect-video')}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={cn('w-full h-full object-cover')}
            />
          </div>

          <div className={cn('bg-gray-800 rounded-lg p-4 text-sm text-gray-400')}>
            <p>💡 캡처 모드가 시작되면 자동으로 연결됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};
