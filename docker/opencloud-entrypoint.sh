#!/bin/sh
set -e

export OC_CONFIG_DIR="${OC_CONFIG_DIR:-/etc/opencloud}"

echo "OpenCloud init çalıştırılıyor (config: $OC_CONFIG_DIR)..."
opencloud init || true

echo "OpenCloud server başlatılıyor..."
exec opencloud server
