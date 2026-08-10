#!/bin/sh
set -e

echo "PostgreSQL bekleniyor..."
until node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL || 'postgresql://db:5432');
const host = url.hostname;
const port = parseInt(url.port || '5432', 10);
const socket = net.createConnection(port, host);
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

echo "Veritabanı şeması uygulanıyor..."
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null | grep -v migration_lock.toml)" ]; then
  npx prisma migrate deploy
else
  echo "Migration bulunamadı, prisma db push kullanılıyor..."
  npx prisma db push --skip-generate
fi

if [ "$KANT_AUTO_SEED" = "true" ]; then
  echo "Seed verileri yükleniyor..."
  npx prisma db seed
fi

echo "Zubee başlatılıyor..."
exec npm start
