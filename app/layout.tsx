import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Animalitos a dormir · elevenlabs.io',
  description:
    'Seis animalitos, 36 actividades y voces suaves en español e inglés. Un juego de buenas noches para los más pequeños.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/icon-180.png' },
  appleWebApp: {
    capable: true,
    title: 'Animalitos',
    statusBarStyle: 'default',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf5e9',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
