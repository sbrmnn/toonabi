# Deploying Toonabi On DigitalOcean

This repo is currently best suited to a single DigitalOcean droplet, not App Platform.

Why:

- the Rails backend still uses SQLite in production
- Active Storage also writes to the local filesystem
- the frontend already works well behind a same-origin reverse proxy

The setup in this folder uses:

- `backend` container for Rails
- `frontend` container for the built Vite app
- `caddy` container for HTTPS and routing

## 1. Create the droplet

Recommended starting point:

- Ubuntu 24.04
- 2 GB RAM or larger
- a domain/subdomain pointing at the droplet IP

## 2. Install Docker

On the droplet:

```bash
sudo bash deploy/digitalocean/install-docker.sh
```

## 3. Copy the env file

```bash
cp deploy/digitalocean/.env.example deploy/digitalocean/.env
```

Fill in at least:

- `APP_DOMAIN`
- `LETSENCRYPT_EMAIL`
- `RAILS_MASTER_KEY`

For provider secrets:

- you can set `ANTHROPIC_API_KEY` and TTS keys in the env file, or
- keep them in Rails credentials and only provide `RAILS_MASTER_KEY`

If you are serving frontend and backend on the same domain, leave `VITE_VRM_BASE_URL` blank.

## 4. Deploy

```bash
bash deploy/digitalocean/deploy.sh
```

That will:

- build the frontend image
- build the backend image
- create the SQLite/storage volume
- start Caddy on ports `80` and `443`

## 5. Update later

After pulling new code on the droplet:

```bash
bash deploy/digitalocean/deploy.sh
```

## Notes

- Backend persistence lives in the Docker volume `backend_storage`.
- Caddy manages TLS automatically once DNS points at the droplet.
- API traffic is routed to Rails at `/api/*`.
- The frontend serves the VRM and animation assets directly.
- `APP_DOMAIN`, `LETSENCRYPT_EMAIL`, and `FRONTEND_ORIGIN` are deployment settings, not Rails credentials.
