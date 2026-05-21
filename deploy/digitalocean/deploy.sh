#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/deploy/digitalocean/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Copy deploy/digitalocean/.env.example to deploy/digitalocean/.env and fill in the secrets."
  exit 1
fi

cd "$ROOT_DIR"

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.digitalocean.yml \
  up -d --build

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.digitalocean.yml \
  ps
