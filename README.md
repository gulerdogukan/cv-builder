# CV Builder — AI Destekli CV Oluşturma Platformu

Türk kullanıcılar için AI destekli, ATS uyumlu CV oluşturma platformu.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** .NET 8 Minimal API + Entity Framework Core
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (Google + Email)
- **PDF:** Node.js + Puppeteer microservice
- **AI:** Anthropic Claude API

## Hızlı Başlangıç

### Gereksinimler

- Node.js 20+
- .NET 8 SDK
- Docker & Docker Compose
- PostgreSQL (veya Docker ile)

### Docker ile çalıştırma

```bash
docker-compose up --build
```

Servisler:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger: http://localhost:5000/swagger
- PDF Service: http://localhost:3001

### Manuel çalıştırma

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend/CvBuilder.Api && dotnet restore && dotnet run

# PDF Service
cd pdf-service && npm install && npm start
```

## Yapılandırma

1. `frontend/.env` dosyasına Supabase bilgilerini girin
2. `backend/CvBuilder.Api/appsettings.Development.json` dosyasını doldurun
3. Supabase projesinde Auth > Providers > Google OAuth'u etkinleştirin

## Proje Yapısı

```
cv-builder/
├── frontend/          # React uygulaması
├── backend/           # .NET 8 API
├── pdf-service/       # Puppeteer PDF servisi
└── docker-compose.yml
```
