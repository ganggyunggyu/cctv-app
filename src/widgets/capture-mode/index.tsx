'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { QRCodeSVG } from 'qrcode.react';
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
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

export const CaptureMode = ({ roomId, onBack }: CaptureModeProps) => {
  const [status, setStatus] = React.useState('초기화 중...');
  const [copied, setCopied] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const peerRef = React.useRef<SimplePeer.Instance | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  const viewerUrl = typeof window !== 'undefined' ? `${window.location.origin}?mode=viewer&roomId=${roomId}` : '';

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

        setStatus('Socket.io 서버 초기화 중...');
        console.log('[Capture] Socket.io 엔드포인트 호출 시작');
        const initRes = await fetch('/api/socket');
        console.log('[Capture] Socket.io 엔드포인트 응답:', initRes.status);

        setStatus('Socket.io 연결 중...');
        console.log('[Capture] Socket.io 클라이언트 연결 시작');
        const socket = io('/', { path: '/api/socket' });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[Capture] Socket.io 연결 성공! ID:', socket.id);
          setStatus(`대기 중 - 뷰어 접속 대기`);
          socket.emit('join-room', roomId);
          console.log('[Capture] 룸 참가 요청:', roomId);
        });

        socket.on('viewer-joined', () => {
          console.log('[Capture] Viewer 참가 확인! Peer 생성 시작');
          setStatus('뷰어 참가됨 - P2P 연결 중...');

          const peer = new SimplePeer({
            initiator: true,
            stream,
            trickle: false,
            config: { iceServers: ICE_SERVERS },
          });

          peerRef.current = peer;

          peer.on('signal', (signal) => {
            console.log('[Capture] Offer 생성, 전송 중');
            socket.emit('offer', { roomId, signal });
          });
          peer.on('connect', () => {
            console.log('[Capture] P2P 연결 성공!');
            setStatus('P2P 연결 성공!');
          });
          peer.on('error', ({ message }) => {
            console.error('[Capture] Peer error:', message);
            setStatus(`에러: ${message}`);
          });
        });

        socket.on('answer', ({ signal }: { signal: SimplePeer.SignalData }) => {
          console.log('[Capture] Answer 수신');
          if (peerRef.current) {
            setStatus('Peer 연결 완료!');
            peerRef.current.signal(signal);
          }
        });

      } catch (error) {
        console.error('Init error:', error);
        setStatus(`카메라 접근 실패: ${error}`);
      }
    };

    initCapture();

    return () => {
      console.log('[Capture] Cleanup 실행');
      streamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.destroy();
      socketRef.current?.disconnect();
    };
  }, []);

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

          <div className={cn('bg-gray-800 rounded-lg p-6 space-y-6')}>
            <div className={cn('text-center')}>
              <p className={cn('text-sm text-gray-400 mb-3')}>
                💡 다른 기기에서 뷰어 모드로 접속하세요
              </p>
              <div className={cn('bg-gray-900 rounded-lg p-4 mb-4')}>
                <p className={cn('text-xs text-gray-500 mb-2')}>룸 ID</p>
                <p className={cn('text-3xl font-bold text-blue-400 font-mono tracking-wider')}>
                  {roomId}
                </p>
              </div>
              <button
                onClick={handleCopyRoomId}
                className={cn(
                  'w-full px-6 py-3 rounded-lg font-semibold transition-all',
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                )}
              >
                {copied ? '✓ 복사됨!' : '📋 룸 ID 복사'}
              </button>
            </div>

            <div className={cn('border-t border-gray-700 pt-6')}>
              <p className={cn('text-sm text-gray-400 text-center mb-4')}>
                또는 QR 코드를 스캔하세요
              </p>
              <div className={cn('flex justify-center bg-white p-4 rounded-lg')}>
                {viewerUrl && <QRCodeSVG value={viewerUrl} size={200} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
