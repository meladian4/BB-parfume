#!/bin/bash
# ==============================================================================
# BB PARFUM PREMIUM — SLIDE PRESENTASI KLIEN (PPT INTERAKTIF)
# Klik 2x file ini di macOS untuk membuka Slide Presentasi ke Klien di Browser.
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "🌟 MEMBUKA SLIDE DECK PRESENTASI KLIEN — BB PARFUM PREMIUM"
echo "================================================================="

# Pastikan server lokal aktif di port 3005 jika belum berjalan
if ! nc -z 127.0.0.1 3005 2>/dev/null; then
  echo "⚡ Server lokal belum aktif. Menjalankan server Next.js di background..."
  nohup npm run dev > /dev/null 2>&1 &
  sleep 3
fi

# Buka halaman presentasi di browser default
open "http://localhost:3005/presentasi"

echo "✅ Slide Presentasi berhasil dibuka di browser Anda!"
echo "   URL: http://localhost:3005/presentasi"
echo "   Tip: Tekan tombol [F] di keyboard untuk mode Fullscreen!"
echo "   Tip: Tekan tombol [N] di keyboard untuk membuka Catatan Pitching!"
echo "================================================================="
exit 0
