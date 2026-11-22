#!/bin/bash
# Script untuk menjalankan BB Parfum Premium Management System di Localhost (Mode Cepat, Ringan & LAN/HP)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo "    BB PARFUM PREMIUM - AUTO RESTART & LAUNCHER         "
echo "========================================================"

# Matikan proses lama yang mungkin macet atau tertinggal di port 3005
OLD_PID=$(lsof -ti :3005 2>/dev/null)
if [ ! -z "$OLD_PID" ]; then
    echo "Membersihkan proses lama di port 3005 (PID: $OLD_PID)..."
    kill -9 $OLD_PID 2>/dev/null || true
    sleep 1
fi

# Cek apakah build produksi sudah ada
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "Mempersiapkan build produksi pertama kali..."
    npm run build
fi

# Dapatkan IP Wi-Fi lokal untuk akses HP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.1.12")

echo "Menjalankan server di http://0.0.0.0:3005 ..."
npm start &
sleep 2

echo "--------------------------------------------------------"
echo "  ✅ SISTEM BB PARFUM AKTIF!"
echo "  💻 Buka di Laptop : http://localhost:3005"
echo "  📱 Buka di HP (WiFi): http://$LOCAL_IP:3005"
echo "--------------------------------------------------------"

open "http://localhost:3005" 2>/dev/null || true

wait
