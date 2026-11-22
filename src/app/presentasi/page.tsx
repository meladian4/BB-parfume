import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Presentasi Klien (PPT) — BB Parfum Premium Management',
  description: 'Slide deck presentasi eksekutif dan prototipe sistem manajemen ritel BB Parfum Kendal',
};

export default function PresentasiPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070A0F]">
      <iframe
        src="/presentasi_klien.html"
        title="BB Parfum Premium Client Pitch Deck"
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}
