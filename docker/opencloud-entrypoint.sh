#!/bin/sh
set -e

echo "OpenCloud init çalıştırılıyor..."
opencloud init --config-path /etc/opencloud --admin-password "${IDM_ADMIN_PASSWORD:-admin}" || true

echo "OpenCloud server başlatılıyor..."
exec opencloud server
