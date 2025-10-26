'use client';

import React from 'react';
import { CaptureMode } from '@/widgets/capture-mode';
import { ViewerMode } from '@/widgets/viewer-mode';
import { cn } from '@/shared';

type Mode = 'select' | 'capture' | 'viewer';

export default function Home() {
  const [mode, setMode] = React.useState<Mode>('select');
  const [roomId, setRoomId] = React.useState('');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlRoomId = params.get('roomId');

    if (urlMode === 'viewer' && urlRoomId) {
      setRoomId(urlRoomId);
      setMode('viewer');
    }
  }, []);

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8);
    setRoomId(id);
    return id;
  };

  const handleModeSelect = () => setMode('select');

  if (mode === 'capture') {
    return <CaptureMode roomId={roomId} onBack={handleModeSelect} />;
  }

  if (mode === 'viewer') {
    return <ViewerMode roomId={roomId} onBack={handleModeSelect} />;
  }

  const handleCaptureClick = () => {
    if (!roomId) {
      const id = generateRoomId();
      setRoomId(id);
    }
    setMode('capture');
  };

  const handleViewerClick = () => {
    if (roomId) {
      setMode('viewer');
    } else {
      alert('룸 ID를 입력하세요');
    }
  };

  return (
    <div className={cn('min-h-screen bg-gray-900 flex items-center justify-center p-4')}>
      <div className={cn('max-w-md w-full space-y-6')}>
        <div className={cn('text-center')}>
          <h1 className={cn('text-3xl font-bold text-white mb-2')}>WebRTC CCTV</h1>
          <p className={cn('text-gray-400')}>iPad → 폰 실시간 스트리밍</p>
        </div>

        <div className={cn('bg-gray-800 rounded-lg p-6 space-y-4')}>
          <div>
            <label className={cn('block text-sm font-medium text-gray-300 mb-2')}>
              룸 ID
            </label>
            <div className={cn('flex gap-2')}>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="룸 ID 입력"
                className={cn(
                  'flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg',
                  'text-white placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
              <button
                onClick={generateRoomId}
                className={cn(
                  'px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg',
                  'text-white transition-colors'
                )}
              >
                생성
              </button>
            </div>
          </div>

          <div className={cn('space-y-3')}>
            <button
              onClick={handleCaptureClick}
              className={cn(
                'w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg',
                'text-white font-medium transition-colors'
              )}
            >
              캡처 모드 (iPad)
            </button>

            <button
              onClick={handleViewerClick}
              className={cn(
                'w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg',
                'text-white font-medium transition-colors'
              )}
            >
              뷰어 모드 (폰)
            </button>
          </div>
        </div>

        <div className={cn('text-center text-sm text-gray-500')}>
          <p>캡처 모드: iPad 후면 카메라 스트리밍</p>
          <p>뷰어 모드: 폰에서 실시간 영상 시청</p>
        </div>
      </div>
    </div>
  );
}
