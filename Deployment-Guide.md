# Full Deployment Guide: React App on a 512 MB VPS

## Overview

**Architecture:** GitHub Actions builds a Docker image → pushes to Docker Hub → VPS pulls and runs it behind Caddy (reverse proxy with automatic HTTPS).

**Stack:** React + Vite → Docker (nginx:alpine) → Docker Hub → DigitalOcean Droplet → Caddy reverse proxy

**Environments:** `mules.henesys.io` (production) and `snow-yeti.henesys.io` (staging)

---

## Part 1 — Domain & DNS

In your domain registrar dashboard (Namecheap, GoDaddy, etc.), create two A records pointing to your Droplet's IP:

| Type | Host/Name   | Value               |
| ---- | ----------- | ------------------- |
| A    | `mules`     | `<your-droplet-ip>` |
| A    | `snow-yeti` | `<your-droplet-ip>` |

DNS propagation can take up to 48 hours, but usually resolves within minutes. Check progress at [dnschecker.org](https://dnschecker.org).

---

## Part 2 — VPS Initial Setup & Hardening

SSH in as root, then run the following in order.

### 1. Create a Non-Root User

Avoid working as root for daily tasks — it's a safety net against accidental destructive commands.

```bash
adduser devuser
usermod -aG sudo devuser
rsync --archive --chown=devuser:devuser ~/.ssh /home/devuser
```

Log out, then log back in as `devuser`:

```bash
ssh devuser@<your-droplet-ip>
```

### 2. Lock Down the Firewall (UFW)

DigitalOcean Droplets are wide open by default. Close everything except what Caddy and SSH need.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> **Note on Docker:** Docker bypasses UFW by default. Since your app containers only talk to Caddy internally (no ports exposed directly to the internet), they are not at risk — but keep this in mind if you ever expose additional ports as you scale.

### 3. Add a 1 GB Swap File

Critical for 512 MB RAM — prevents OOM (Out of Memory) crashes if there's any memory spike.

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Install Docker

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER
```

Log out and back in again so the `docker` group takes effect.

---

## Part 3 — Project Files (in your repo)

**`Dockerfile`** — multi-stage build: Node builds the app, nginx serves it:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`nginx.conf`** — SPA routing fallback + gzip:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
```

**`.dockerignore`** — keeps build context small:

```
node_modules
.git
.github
dist
.claude
*.md
```

---

## Part 4 — GitHub Actions CI/CD

**`.github/workflows/ci-cd.yaml`:**

```yaml
name: CI/CD

on:
  push:
    branches: [main]

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  ci:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test

  docker:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    needs: ci
    steps:
      - uses: actions/checkout@v4
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/ms-mule-income-tracker:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/ms-mule-income-tracker:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Add secrets to GitHub** — go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret name          | Value                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username                                                                                   |
| `DOCKERHUB_TOKEN`    | A Docker Hub Personal Access Token (created at hub.docker.com → Account Settings → Personal access tokens) |

---

## Part 5 — VPS Deployment Files

SSH into your droplet and create a project folder:

```bash
mkdir ~/app && cd ~/app
```

**`docker-compose.yml`:**

```yaml
services:
  caddy:
    image: caddy:latest
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web-network
    deploy:
      resources:
        limits:
          memory: 100M

  mules:
    image: <your-dockerhub-username>/ms-mule-income-tracker:latest
    restart: unless-stopped
    networks:
      - web-network
    deploy:
      resources:
        limits:
          memory: 64M

  snow-yeti:
    image: <your-dockerhub-username>/ms-mule-income-tracker:staging
    restart: unless-stopped
    networks:
      - web-network
    deploy:
      resources:
        limits:
          memory: 64M

networks:
  web-network:

volumes:
  caddy_data:
  caddy_config:
```

**`Caddyfile`:**

```
mules.henesys.io {
    reverse_proxy mules:80
}

snow-yeti.henesys.io {
    reverse_proxy snow-yeti:80
}
```

> **Container Names:** The names `mules` and `snow-yeti` in the Caddyfile must exactly match the service names in `docker-compose.yml`. Docker handles the internal DNS automatically — Caddy resolves those names to the correct container without any extra configuration.

> Caddy automatically provisions and renews SSL certificates via Let's Encrypt. The `caddy_data` volume persists them — don't remove it or you may hit rate limits.

---

## Part 6 — First Deployment

On your droplet:

```bash
cd ~/app
docker compose pull
docker compose up -d
```

Check everything is running:

```bash
docker compose ps
docker compose logs -f
```

---

## Part 7 — Ongoing Workflow

Every push to `main` triggers the full pipeline automatically:

1. GitHub Actions runs lint + tests
2. On success, builds the Docker image and pushes `latest` + `<git-sha>` tags to Docker Hub
3. SSH into the droplet and redeploy:

```bash
cd ~/app
docker compose pull
docker compose up -d
```

> You can automate step 3 later with a webhook or by extending the GitHub Actions workflow to SSH into the droplet — but manual pull is the safest starting point.

---

## Quick Reference

| What             | Where                                    |
| ---------------- | ---------------------------------------- |
| CI/CD logs       | github.com → your repo → Actions tab     |
| Docker images    | hub.docker.com → your repositories       |
| Live app         | https://mules.henesys.io                 |
| Staging app      | https://snow-yeti.henesys.io             |
| VPS files        | `~/app/` on the droplet                  |
| Check containers | `docker compose ps`                      |
| View logs        | `docker compose logs -f`                 |
| Rollback to SHA  | `docker compose pull <sha>` then `up -d` |
