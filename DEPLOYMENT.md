# CV Builder — Deployment Guide

Stack: **Vercel** (frontend) + **Railway** (backend + pdf-service + PostgreSQL)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Frontend build |
| .NET SDK | 8.0 | Backend build (local) |
| Vercel CLI | latest | `npm i -g vercel` |
| Railway CLI | latest | `npm i -g @railway/cli` |
| Git | any | Source control |

---

## 1 · Supabase Setup

1. Create project at https://supabase.com
2. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `JWT Secret` (Settings → API → JWT Settings) → `Supabase__JwtSecret`
3. Run the DB migration scripts in order:

```bash
# In Supabase SQL Editor or via psql:
psql $DATABASE_URL -f backend/CvBuilder.Api/Data/Migrations/001_InitialSchema.sql
# AddAIRateLimitToUsers.sql — 001_InitialSchema.sql icinde dahil edilmistir
```

---

## 2 · Railway Setup (Backend + PDF Service + DB)

### 2.1 Create project

```bash
railway login
railway init   # creates new Railway project
```

### 2.2 Add PostgreSQL plugin

```
Railway Dashboard → your project → + New → Database → PostgreSQL
```

Railway auto-injects `DATABASE_URL`. Copy the connection string into
`ConnectionStrings__DefaultConnection` format:
```
Host=...;Port=5432;Database=railway;Username=postgres;Password=...;Ssl Mode=Require
```

### 2.3 Deploy Backend API

```bash
cd backend
railway up --service cv-builder-api
```

Set environment variables in Railway Dashboard → cv-builder-api → Variables:

```
ConnectionStrings__DefaultConnection   = <from Railway Postgres plugin>
Supabase__Url                          = https://xxxx.supabase.co
Supabase__AnonKey                      = eyJ...
Supabase__JwtSecret                    = <jwt secret>
Anthropic__ApiKey                      = sk-ant-api03-...
Iyzico__ApiKey                         = <live key>
Iyzico__SecretKey                      = <live secret>
Iyzico__BaseUrl                        = https://api.iyzipay.com
PdfService__BaseUrl                    = https://cv-builder-pdf.railway.internal
App__FrontendUrl                       = https://cvbuilder.app
App__CorsOrigins__0                    = https://cvbuilder.app
App__CorsOrigins__1                    = https://www.cvbuilder.app
ASPNETCORE_ENVIRONMENT                 = Production
PORT                                   = (set by Railway automatically)
```

### 2.4 Deploy PDF Microservice

```bash
cd pdf-service
railway up --service cv-builder-pdf
```

Environment variables (Railway Dashboard → cv-builder-pdf → Variables):

```
NODE_ENV  = production
PORT      = (set by Railway automatically)
```

### 2.5 Verify deployments

```bash
# Backend health
curl https://cv-builder-api.railway.app/health

# PDF service health
curl https://cv-builder-pdf.railway.app/health
```

---

## 3 · Vercel Setup (Frontend)

### 3.1 Link project

```bash
cd frontend
vercel link   # select or create project
```

### 3.2 Set environment variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_SUPABASE_URL      = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
VITE_API_BASE_URL      = https://cv-builder-api.railway.app
VITE_PDF_SERVICE_URL   = https://cv-builder-pdf.railway.app
```

> ⚠️ Vite bakes env vars at **build time**. After changing values, re-deploy.

### 3.3 Deploy

```bash
vercel --prod
```

Or push to `main` branch — GitHub Actions runs `deploy.yml` automatically.

---

## 4 · Custom Domain (optional)

**Vercel:**
```
Project → Settings → Domains → Add → cvbuilder.app
```
Update DNS: `A 76.76.21.21` or CNAME `cname.vercel-dns.com`

**Railway:**
```
Service → Settings → Networking → Custom Domain → api.cvbuilder.app
```

After adding domain, update these env vars:
- `App__FrontendUrl` → `https://cvbuilder.app`
- `App__CorsOrigins__0` → `https://cvbuilder.app`
- `VITE_API_BASE_URL` → `https://api.cvbuilder.app` (Vercel)

---

## 5 · GitHub Actions Secrets

Go to repo → **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (vercel.com/account/tokens) |
| `RAILWAY_TOKEN` | Railway API token (railway.app/account/tokens) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_API_BASE_URL` | Deployed backend URL |
| `VITE_PDF_SERVICE_URL` | Deployed PDF service URL |

CI runs on every push. Deployment to production only runs on `main` branch.

---

## 6 · İyzico Production Checklist

- [ ] Request live API keys from https://merchant.iyzipay.com
- [ ] Change `Iyzico__BaseUrl` to `https://api.iyzipay.com`
- [ ] Test payment flow end-to-end in staging first
- [ ] Verify webhook/callback URL is reachable: `POST /api/payment/callback`
- [ ] Set `App__FrontendUrl` to production domain for callback redirects

---

## 7 · Post-Deploy Verification

```bash
# 1. Landing page loads
curl -I https://cvbuilder.app

# 2. API health check
curl https://api.cvbuilder.app/health

# 3. PDF service health
curl https://pdf.cvbuilder.app/health

# 4. Register a test user and create a CV
# 5. Generate a PDF (paid plan test)
# 6. Complete a payment with İyzico test card:
#    Card: 5528790000000008 | CVV: 123 | Exp: 12/30
```

---

## 8 · Environment Summary

| Service | Platform | URL pattern |
|---------|----------|-------------|
| Frontend | Vercel | `https://cvbuilder.app` |
| Backend API | Railway | `https://cv-builder-api.railway.app` |
| PDF Service | Railway | `https://cv-builder-pdf.railway.app` |
| Database | Railway (Postgres) | Internal only |
