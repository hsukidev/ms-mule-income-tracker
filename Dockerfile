# Stage 1 — build
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2 — serve
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Place the nginx config as a template — the official nginx image's
# entrypoint runs envsubst over /etc/nginx/templates/*.template at start
# and writes the result to /etc/nginx/conf.d/<basename without .template>.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Restrict envsubst to only substitute PROXY_SECRET so nginx's own
# variables ($uri, $proxy_pass targets, etc.) are left alone.
ENV NGINX_ENVSUBST_FILTER=^PROXY_SECRET$

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]