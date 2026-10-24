#!/usr/bin/env bash
# Restaura un respaldo (.dump) en la base de datos. REEMPLAZA todo lo que haya.
# Sirve para recuperar un respaldo o para subir al servidor lo que ya configuraste en tu PC.
# Uso: bash deploy/restore.sh backups/archivo.dump
set -euo pipefail
cd "$(dirname "$0")/.."

dump="${1:?Indica el archivo .dump a restaurar}"
[ -f "$dump" ] || { echo "* No existe $dump" >&2; exit 1; }

read -r -p "* Esto reemplaza TODOS los datos actuales con $dump. ¿Seguir? (escribe si) " answer
[ "$answer" = "si" ] || { echo "* Cancelado."; exit 0; }

echo "* Deteniendo la API mientras se restaura..."
docker compose stop api

docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < "$dump"

docker compose start api
echo "* Restaurado. La API aplica las migraciones pendientes al arrancar."
