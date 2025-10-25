import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebRTC CCTV',
  description: 'iPad to Phone real-time video streaming',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
