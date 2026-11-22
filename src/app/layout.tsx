import type { Metadata } from 'next';
import './globals.css';
import { NavigationProvider } from '@/context/NavigationContext';

export const metadata: Metadata = {
  title: 'BB Parfum Premium — Retail & POS Management System',
  description: 'Sistem Manajemen Retail Parfum Multi-Cabang Kendal (1 Gudang Pusat & 3 Cabang Toko)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#090D16] text-[#F8FAFC] antialiased">
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </body>
    </html>
  );
}
