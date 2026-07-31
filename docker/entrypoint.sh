#!/bin/sh
set -e

echo "PostgreSQL bekleniyor..."
until node -e "
const net = require('net');
const socket = net.createConnection(5432, 'db');
socket.on('connect', () => { socket.end(); process.exit(0); });
socket.on('error', () => process.exit(1));
" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL hazır."

if [ "$OPENCLOUD_ENABLED" = "true" ]; then
  echo "OpenCloud yapılandırılıyor..."
  npx tsx scripts/docker-opencloud-init.ts
fi

echo "Veritabanı migration'ları uygulanıyor..."
npx prisma migrate deploy

if [ "$KANT_AUTO_SEED" = "true" ]; then
  echo "Seed verileri yükleniyor..."
  npx prisma db seed
fi

echo "Kant başlatılıyor..."
exec npm start
