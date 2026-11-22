#!/bin/bash
# Script untuk Meng-online-kan BB Parfum Sementara via Cloudflare Tunnel Gratis
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo "    BB PARFUM - ONLINE KAN SEMENTARA (CLOUDFLARE)       "
echo "========================================================"

# Pastikan server port 3005 aktif
if ! lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
    echo "Menyalakan server lokal terlebih dahulu..."
    npm start &
    sleep 3
fi

echo "Sedang membuat link online publik (HTTPS)..."
echo "--------------------------------------------------------"
echo "Silakan salin (copy) link 'https://...trycloudflare.com'"
echo "yang muncul di bawah ini untuk dibuka di HP dari mana saja:"
echo "--------------------------------------------------------"
echo "Tekan Ctrl + C untuk mematikan mode online jika sudah selesai."
echo ""

cloudflared tunnel --url http://localhost:3005
