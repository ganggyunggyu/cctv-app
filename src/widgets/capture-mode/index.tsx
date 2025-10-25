'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { cn } from '@/shared';

interface CaptureModeProps {
  roomId: string;
  onBack: () => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

export const CaptureMode = ({ roomId, onBack }: CaptureModeProps) => {
  const [status, setStatus] = React.useState('초기화 중...');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const peerRef = React.useRef<SimplePeer.Instance | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    const initCapture = async () => {
      try {
        if (typeof window === 'undefined' || !navigator.mediaDevices) {
          setStatus('브라우저 환경이 아니거나 카메라를 지원하지 않습니다');
          return;
        }

        setStatus('카메라 접근 중...');
        const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus('Socket.io 연결 중...');
        const socket = io('/', { path: '/api/socket' });
        socketRef.current = socket;

        socket.on('connect', () => {
          setStatus(`연결됨 - 룸: ${roomId}`);
          socket.emit('join-room', roomId);
        });

        socket.on('answer', ({ signal }: { signal: SimplePeer.SignalData }) => {
          if (peerRef.current) {
            setStatus('Peer 연결 완료!');
            peerRef.current.signal(signal);
          }
        });

        const peer = new SimplePeer({
          initiator: true,
          stream,
          trickle: true,
          config: { iceServers: ICE_SERVERS },
        });

        peerRef.current = peer;

        peer.on('signal', (signal) => socket.emit('offer', { roomId, signal }));
        peer.on('connect', () => setStatus('P2P 연결 성공!'));
        peer.on('error', ({ message }) => {
          console.error('Peer error:', message);
          setStatus(`에러: ${message}`);
        });

      } catch (error) {
        console.error('Init error:', error);
        setStatus(`카메라 접근 실패: ${error}`);
      }
    };

    initCapture();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.destroy();
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  return (
    <div className={cn('min-h-screen bg-gray-900 flex flex-col')}>
      <div className={cn('bg-gray-800 p-4 border-b border-gray-700')}>
        <div className={cn('max-w-7xl mx-auto flex items-center justify-between')}>
          <div>
            <h2 className={cn('text-xl font-bold text-white')}>캡처 모드</h2>
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
              muted
              className={cn('w-full h-full object-cover')}
            />
          </div>

          <div className={cn('bg-gray-800 rounded-lg p-4 text-sm text-gray-400')}>
            <p>💡 다른 기기에서 뷰어 모드로 접속하세요</p>
            <p className={cn('mt-2 font-mono text-blue-400')}>룸 ID: {roomId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
