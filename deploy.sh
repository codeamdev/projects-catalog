#!/bin/bash
set -e
cd /srv/catalogo

echo "→ Bajando cambios..."
git pull origin master

echo "→ Reconstruyendo imagen..."
docker compose --env-file .env.production build app

echo "→ Reiniciando sin downtime..."
docker compose --env-file .env.production up -d --no-deps app

echo "✅ Deploy completado - $(date)"
