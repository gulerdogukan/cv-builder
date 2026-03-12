# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

COPY . .

# Build args become Vite env vars at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ARG VITE_PDF_SERVICE_URL

RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Copy compiled assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config: SPA fallback + gzip + security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
