import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NavigationProvider } from '@/context/NavigationContext';
import { PwaInstaller } from '@/components/pwa/PwaInstaller';

export const viewport: Viewport = {
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'BB Parfum Premium — Retail & POS Management System',
  description: 'Sistem Manajemen Retail Parfum Multi-Cabang Kendal (1 Gudang Pusat & 3 Cabang Toko)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BB Parfum',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#090D16] text-[#F8FAFC] antialiased">
        <NavigationProvider>
          {children}
          <PwaInstaller />
        </NavigationProvider>
      </body>
    </html>
  );
}
