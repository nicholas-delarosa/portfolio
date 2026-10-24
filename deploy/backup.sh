#!/usr/bin/env bash
# Copia de seguridad de la base de datos (proyectos, perfil, CV, mensajes...). Guarda las últimas 14.
# Uso: bash deploy/backup.sh   (setup-server.sh lo programa todos los días)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups

file="backups/portfolio-$(date +%Y%m%d-%H%M).dump"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file"
echo "* Respaldo creado: $file ($(du -h "$file" | cut -f1))"

ls -1t backups/portfolio-*.dump | tail -n +15 | xargs -r rm --
