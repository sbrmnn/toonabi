# Deploying Toonabi on DigitalOcean

Toonabi runs as three Docker containers on a single DigitalOcean droplet:

- `backend` — Rails 8 API (Puma + Thruster, SQLite, Active Storage on local disk)
- `frontend` — nginx serving the built Vite SPA
- `caddy` — TLS + reverse proxy on `:80` / `:443`, routing `/api/*` and `/up` to the backend and everything else to the frontend

## Where it's running

| Thing | Value |
|---|---|
| Droplet | `toonabi` (`159.89.191.35`, NYC3) |
| Domain | `toonabi.com` (DNS on DigitalOcean) |
| Live URL | https://toonabi.com |
| Branch deployed | `ghibli` |
| Code location on droplet | `/opt/toonabi` |
| SSH access | `ssh root@159.89.191.35` |
| Secrets file on droplet | `/opt/toonabi/deploy/digitalocean/.env` (mode 600) |
| SQLite volume | Docker volume `backend_storage` |

## Updating an existing deploy

```sh
git push origin ghibli
bin/remote deploy
```

`bin/remote` is a small wrapper that SSHes to the droplet and runs the long docker compose commands for you. Run `bin/remote help` for the full list.

The deploy script rebuilds the changed images, recreates the affected containers, and leaves the SQLite volume intact. There is a brief restart, not zero-downtime — for a side project that is fine.

Verify:

```sh
curl -fsS https://toonabi.com/up                  # → 200
curl -sN -X POST https://toonabi.com/api/v1/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"character_id":"saki","messages":[{"role":"user","content":"hi"}]}' | head -2
```

## Fresh deploy on a new droplet

Only needed if you provision a new droplet (or wipe `/opt/toonabi`).

### 1. Create the droplet

- Ubuntu 24.04
- ≥ 2 GB RAM
- Add your SSH key during creation so root login works
- Point your domain at the droplet IP (the existing `toonabi.com` DNS already lives on DigitalOcean)

### 2. Install Docker

```sh
ssh root@<droplet-ip>
bash <(curl -fsSL https://raw.githubusercontent.com/sbrmnn/toonabi/ghibli/deploy/digitalocean/install-docker.sh)
```

### 3. Clone the repo

```sh
git clone --branch ghibli --depth 1 https://github.com/sbrmnn/toonabi.git /opt/toonabi
cd /opt/toonabi
```

### 4. Configure secrets

```sh
cp deploy/digitalocean/.env.example deploy/digitalocean/.env
chmod 600 deploy/digitalocean/.env
$EDITOR deploy/digitalocean/.env
```

Fill in at minimum:

- `APP_DOMAIN` — the public domain (e.g. `toonabi.com`)
- `LETSENCRYPT_EMAIL` — used by Caddy for cert renewal notices
- `RAILS_MASTER_KEY` — copy from your local `backend/config/master.key`

API keys (`ANTHROPIC_API_KEY`, `FISH_AUDIO_API_KEY`, `ELEVENLABS_API_KEY`) can be left blank if they're already inside `backend/config/credentials.yml.enc`. Rails decrypts those at boot using `RAILS_MASTER_KEY`.

### 5. Deploy

```sh
bash deploy/digitalocean/deploy.sh
```

That builds the two images, starts all three containers, and Caddy will issue a Let's Encrypt certificate the first time the domain resolves.

## Common operations

All run from your laptop in this repo:

```sh
bin/remote deploy            # pull + rebuild + restart
bin/remote logs              # tail all containers
bin/remote logs backend      # tail just one
bin/remote ps                # container status
bin/remote restart backend   # restart one service
bin/remote console           # Rails console on the droplet
bin/remote dbconsole         # Rails dbconsole
bin/remote shell             # bash on the droplet itself
bin/remote raw down          # any docker compose subcommand
bin/remote exec ls /rails    # any docker compose exec against backend
```

Set `TOONABI_HOST` / `TOONABI_DIR` / `TOONABI_BRANCH` env vars to point the script at a different server or branch.

SQLite backup (run on the droplet — `bin/remote shell` first):

```sh
docker run --rm -v backend_storage:/data -v $PWD:/backup alpine \
  sh -c "cp /data/production.sqlite3 /backup/toonabi-$(date +%F).sqlite3"
```

## Updating Rails credentials

`config/credentials.yml.enc` is committed to the repo, so edit it locally and let the deploy pick it up:

```sh
cd backend && EDITOR="open -t -W" bin/rails credentials:edit
cd ..
git commit -am "Update credentials"
git push origin ghibli
bin/remote deploy
```

The `RAILS_MASTER_KEY` on the droplet stays the same — only the encrypted file changes.

## Troubleshooting

**`/up` returns 502 / "no response"**
Caddy is up but the backend container isn't healthy yet (boot, migrations, or a crash). Check:
```sh
bin/remote logs backend
```

**Cert errors / "your connection is not private"**
Caddy needs the domain to resolve to the droplet *and* ports 80/443 reachable from the internet. Check:
```sh
dig +short toonabi.com               # → 159.89.191.35
bin/remote logs caddy | grep -i "obtained\|error"
```

**Container won't start with "RAILS_MASTER_KEY missing"**
The `.env` file isn't being picked up — either it's missing, has the wrong name, or `deploy.sh` was run without it. Confirm:
```sh
ls -la /opt/toonabi/deploy/digitalocean/.env
grep RAILS_MASTER_KEY /opt/toonabi/deploy/digitalocean/.env
```

**Need to redeploy from a different branch**
```sh
TOONABI_BRANCH=<branch> bin/remote deploy
```

## Notes

- Backend persistence (SQLite + Active Storage uploads) lives in the Docker volume `backend_storage`. It survives `down` / rebuilds but not `docker volume rm`.
- The frontend Dockerfile bakes `npm run build` output into an nginx image. To change frontend env vars (`VITE_VRM_BASE_URL` etc.), rebuild — runtime changes won't take effect.
- Caddy handles TLS automatically; no manual certbot.
- `APP_DOMAIN`, `LETSENCRYPT_EMAIL`, and `FRONTEND_ORIGIN` are deployment settings (passed via `.env`), not Rails credentials.
