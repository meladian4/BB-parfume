'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cek apakah sudah berjalan sebagai aplikasi standalone (PWA terinstal)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Registrasi Service Worker agar Chrome Android mengenali sebagai Installable PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('SW registration failed:', err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  if (isInstalled || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-[#0F172A] border border-[#D4AF37]/60 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">Install Aplikasi BB Parfum</p>
          <p className="text-[10px] text-slate-400">
            Pasang di layar utama HP Android untuk akses cepat layar penuh
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
