#!/usr/bin/env bash
# Publica la última versión: trae los cambios de GitHub, reconstruye y reinicia lo que cambió.
# Uso (en el servidor, dentro de la carpeta del repo): bash deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "* Falta el archivo .env. Cópialo de .env.example y llénalo primero." >&2
  exit 1
fi

echo "* Trayendo los cambios de GitHub..."
git pull --ff-only

echo "* Construyendo y levantando los contenedores..."
docker compose up -d --build --remove-orphans

echo "* Borrando imágenes viejas para no llenar el disco..."
docker image prune -f >/dev/null

echo "* Esperando a que la API responda..."
for _ in $(seq 1 60); do
  if docker compose exec -T caddy wget -qO- http://api:8080/api/health >/dev/null 2>&1; then
    echo "* Todo arriba:"
    docker compose ps --format 'table {{.Service}}\t{{.Status}}'
    exit 0
  fi
  sleep 2
done

echo "* La API no respondió en 2 minutos. Revisa: docker compose logs api --tail 50" >&2
exit 1
