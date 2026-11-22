import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap Alur Proses Data — BB Parfum Premium Management',
  description: 'Visualisasi alur proses data dari awal (PO Supplier) sampai akhir (Laba Rugi & Backup) BB Parfum Kendal',
};

export default function RoadmapPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070A0F]">
      <iframe
        src="/roadmap_proses_data.html"
        title="BB Parfum Data Process Roadmap"
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}
