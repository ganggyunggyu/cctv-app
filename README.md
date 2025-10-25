# WebRTC CCTV App

Next.js + Socket.io + WebRTC로 만든 실시간 비디오 스트리밍 앱

iPad 후면 카메라를 CCTV처럼 사용하고, 폰에서 실시간으로 시청 가능!

## 기술 스택

- **Next.js 16** - React 풀스택 프레임워크
- **Socket.io** - WebRTC 시그널링 서버
- **Simple-Peer** - WebRTC P2P 연결 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

## 사용 방법

### 1. 캡처 모드 (iPad)
1. iPad에서 앱 접속
2. "캡처 모드 (iPad)" 선택
3. 카메라 권한 허용
4. 생성된 룸 ID 확인

### 2. 뷰어 모드 (폰)
1. 폰에서 앱 접속
2. 캡처 모드에서 생성된 룸 ID 입력
3. "뷰어 모드 (폰)" 선택
4. 자동으로 스트림 연결

## 기능

- ✅ iPad 후면 카메라 캡처
- ✅ P2P 실시간 스트리밍
- ✅ 룸 ID 기반 연결
- ✅ STUN 서버 (Google)
- ✅ 반응형 UI

## 배포

### Vercel
```bash
npm install -g vercel
vercel --prod
```

배포 후 HTTPS URL로 접속 필요 (WebRTC는 HTTPS 필수!)

## 주의사항

- 카메라 권한 허용 필수
- iOS Safari: 설정 > Safari > 카메라 허용
- 원격 접속 시 HTTPS 필수
- NAT 환경에서는 TURN 서버 필요할 수 있음

## 트러블슈팅

### 카메라가 안 켜져요
- 브라우저 카메라 권한 확인
- iOS: 설정 앱에서 Safari 권한 확인

### 연결이 안 돼요
- 같은 룸 ID 사용 확인
- 콘솔 에러 확인
- HTTPS 사용 확인 (로컬에서는 localhost OK)

### 영상이 끊겨요
- 네트워크 상태 확인
- TURN 서버 추가 고려

## 라이센스

MIT
