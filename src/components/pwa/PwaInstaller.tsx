'use client';

import { useEffect } from 'react';

export function PwaInstaller() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Tetap daftarkan Service Worker agar PWA tetap bisa di-install dari menu Chrome Android
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('SW registration failed:', err));
    }
  }, []);

  // Tidak menampilkan popup melayang agar layar dashboard/kasir selalu bersih
  return null;
}
