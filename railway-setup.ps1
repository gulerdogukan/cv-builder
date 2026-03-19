# ============================================================
# CV Builder — Railway Monorepo Kurulum Scripti
# Çalıştırma: cd C:\Users\DOU\CVBuilder\cv-builder
#             .\railway-setup.ps1
# Gereksinim: railway CLI kurulu ve `railway login` yapılmış
# ============================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Yardımcı fonksiyonlar ───────────────────────────────────────────────────
function Write-Step { param($msg) Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "  · $msg" -ForegroundColor Gray }

# .env dosyasından değerleri oku (# ile başlayan satırları atla)
function Get-EnvValue {
    param([string]$Key)
    $line = Get-Content ".env" -ErrorAction SilentlyContinue |
            Where-Object { $_ -match "^$Key=" } |
            Select-Object -First 1
    if ($line) { return ($line -split "=", 2)[1].Trim() }
    return ""
}

# ─── Proje kökünde olduğundan emin ol ────────────────────────────────────────
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error "Bu scripti proje kökünden çalıştır: cd C:\Users\DOU\CVBuilder\cv-builder"
    exit 1
}

Write-Host "`n╔══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   CV Builder — Railway Monorepo Kurulumu             ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

# ─── ADIM 1: Yeni proje oluştur ──────────────────────────────────────────────
Write-Step "ADIM 1: Yeni Railway projesi oluşturuluyor..."
Write-Info "Proje adı: cv-builder-prod"
Write-Warn "railway init açıldığında 'Empty Project' seç ve adı 'cv-builder-prod' yap."
railway init --name cv-builder-prod
Write-Ok "Proje oluşturuldu."

# ─── ADIM 2: Servisleri oluştur ──────────────────────────────────────────────
Write-Step "ADIM 2: Servisler oluşturuluyor..."

railway service create --name backend
Write-Ok "backend servisi oluşturuldu."

railway service create --name frontend
Write-Ok "frontend servisi oluşturuldu."

railway service create --name pdf-service
Write-Ok "pdf-service servisi oluşturuldu."

# ─── ADIM 3: PostgreSQL veritabanı ekle ──────────────────────────────────────
Write-Step "ADIM 3: PostgreSQL veritabanı ekleniyor..."
railway add --plugin postgresql
Write-Ok "PostgreSQL eklendi."
Write-Warn "Veritabanı hazır olunca Railway, DATABASE_URL ve DATABASE_PRIVATE_URL sağlayacak."
Write-Info "Backend servisine DB bağlantısı için bu değerleri kullanacağız."

# ─── ADIM 4: Backend ortam değişkenleri ──────────────────────────────────────
Write-Step "ADIM 4: Backend ortam değişkenleri ayarlanıyor..."

$SUPABASE_URL       = Get-EnvValue "SUPABASE_URL"
$SUPABASE_JWT       = Get-EnvValue "SUPABASE_JWT_SECRET"
$SUPABASE_WEBHOOK   = Get-EnvValue "SUPABASE_WEBHOOK_SECRET"
$GEMINI_KEY         = Get-EnvValue "GEMINI_API_KEY"
$INTERNAL_SECRET    = Get-EnvValue "INTERNAL_SECRET"
$IYZICO_API         = Get-EnvValue "IYZICO_API_KEY"
$IYZICO_SECRET      = Get-EnvValue "IYZICO_SECRET_KEY"

# Railway'de backend servisine geç
railway service backend

# Temel .NET ayarları
railway variables set "ASPNETCORE_ENVIRONMENT=Production" --service backend
railway variables set "DOTNET_RUNNING_IN_CONTAINER=true"  --service backend
railway variables set "PORT=8080"                          --service backend

# Supabase
railway variables set "Supabase__Url=$SUPABASE_URL"               --service backend
railway variables set "Supabase__JwtSecret=$SUPABASE_JWT"         --service backend
railway variables set "Supabase__WebhookSecret=$SUPABASE_WEBHOOK" --service backend

# Gemini AI
railway variables set "Gemini__ApiKey=$GEMINI_KEY"                --service backend
railway variables set "Gemini__FlashModel=gemini-2.5-flash"       --service backend
railway variables set "Gemini__LiteModel=gemini-2.5-flash-lite"   --service backend

# Internal Secret
railway variables set "InternalSecret=$INTERNAL_SECRET" --service backend

# İyzico (boşsa atla)
if ($IYZICO_API) {
    railway variables set "Iyzico__ApiKey=$IYZICO_API"         --service backend
    railway variables set "Iyzico__SecretKey=$IYZICO_SECRET"   --service backend
}
railway variables set "Iyzico__OneTimePrice=99.0"  --service backend
railway variables set "Iyzico__MonthlyPrice=49.0"  --service backend

# PdfService URL — Railway internal domain (pdf-service servisi için)
# railway internal domain formatı: pdf-service.railway.internal
railway variables set "PdfService__BaseUrl=http://pdf-service.railway.internal:3001" --service backend

# App URL'leri — deploy sonrası FRONTEND_URL değerini gir
Write-Warn "NOT: App__FrontendUrl ve App__CorsOrigins frontend deploy sonrası güncellenecek."
Write-Warn "     Şimdilik placeholder değer ekleniyor."
railway variables set "App__FrontendUrl=https://PLACEHOLDER-UPDATE-AFTER-DEPLOY.up.railway.app" --service backend
railway variables set "App__CorsOrigins__0=https://PLACEHOLDER-UPDATE-AFTER-DEPLOY.up.railway.app" --service backend

# DB bağlantısı — PostgreSQL eklentisi sonrası Railway otomatik DATABASE_URL sağlar.
# Bu komut Railway'nin PostgreSQL servisine referans ekler:
Write-Info "DB bağlantısı için Railway shared variable kullanılıyor..."
railway variables set 'ConnectionStrings__DefaultConnection=${{Postgres.DATABASE_URL}}' --service backend

Write-Ok "Backend değişkenleri ayarlandı."

# ─── ADIM 5: PDF Service ortam değişkenleri ──────────────────────────────────
Write-Step "ADIM 5: PDF Service ortam değişkenleri ayarlanıyor..."

railway variables set "PORT=3001"                --service pdf-service
railway variables set "NODE_ENV=production"      --service pdf-service
railway variables set "ALLOWED_ORIGINS=https://PLACEHOLDER-UPDATE-AFTER-DEPLOY.up.railway.app" --service pdf-service

Write-Ok "PDF Service değişkenleri ayarlandı."
Write-Warn "ALLOWED_ORIGINS'i frontend URL belli olunca güncelle."

# ─── ADIM 6: Frontend ortam değişkenleri ─────────────────────────────────────
Write-Step "ADIM 6: Frontend build değişkenleri ayarlanıyor..."

$SUPABASE_ANON = Get-EnvValue "SUPABASE_ANON_KEY"

railway variables set "VITE_SUPABASE_URL=$SUPABASE_URL"       --service frontend
railway variables set "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON" --service frontend
# API ve PDF URL'leri — backend/pdf deploy sonrası güncelle
railway variables set "VITE_API_BASE_URL=https://PLACEHOLDER-BACKEND.up.railway.app"     --service frontend
railway variables set "VITE_PDF_SERVICE_URL=https://PLACEHOLDER-PDF.up.railway.app"      --service frontend

Write-Ok "Frontend değişkenleri ayarlandı."
Write-Warn "VITE_API_BASE_URL ve VITE_PDF_SERVICE_URL servis URL'leri belli olunca güncelle."

# ─── ADIM 7: GitHub bağlantısı ve Dockerfile ayarları ───────────────────────
Write-Step "ADIM 7: GitHub + Dockerfile yapılandırması"
Write-Host @"

  ╔══════════════════════════════════════════════════════════════╗
  ║  Dashboard'da şu adımları manuel yap (her servis için):      ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                                                              ║
  ║  1. https://railway.app → cv-builder-prod projesi            ║
  ║                                                              ║
  ║  ── BACKEND SERVİSİ ──────────────────────────────────────   ║
  ║  2. backend → Settings → Source → Connect GitHub Repo        ║
  ║  3. backend → Settings → Build:                              ║
  ║       Root Directory: (BOŞALT — repo root)                   ║
  ║       Dockerfile Path: backend/Dockerfile                    ║
  ║                                                              ║
  ║  ── FRONTEND SERVİSİ ─────────────────────────────────────   ║
  ║  4. frontend → Settings → Source → Connect GitHub Repo       ║
  ║  5. frontend → Settings → Build:                             ║
  ║       Root Directory: (BOŞALT — repo root)                   ║
  ║       Dockerfile Path: frontend/Dockerfile                   ║
  ║                                                              ║
  ║  ── PDF SERVİSİ ──────────────────────────────────────────   ║
  ║  6. pdf-service → Settings → Source → Connect GitHub Repo    ║
  ║  7. pdf-service → Settings → Build:                          ║
  ║       Root Directory: (BOŞALT — repo root)                   ║
  ║       Dockerfile Path: pdf-service/Dockerfile                ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Yellow

Read-Host "Dashboard ayarlarını yaptıktan sonra Enter'a bas"

# ─── ADIM 8: Deploy ──────────────────────────────────────────────────────────
Write-Step "ADIM 8: Servisler deploy ediliyor..."
Write-Info "Backend deploy ediliyor..."
railway up --service backend --detach

Write-Info "PDF Service deploy ediliyor..."
railway up --service pdf-service --detach

Write-Info "Frontend deploy ediliyor (en son — backend URL gerekli)..."
Write-Warn "Frontend build sırasında VITE_API_BASE_URL'i gerçek backend URL'i ile güncellemelisin."
railway up --service frontend --detach

Write-Ok "Tüm servisler deploy başlatıldı. `railway status` ile izleyebilirsin."

# ─── ADIM 9: Özel domain ─────────────────────────────────────────────────────
Write-Step "ADIM 9: Özel domain (cvolustur.online) ayarlanıyor..."
Write-Info "Frontend servisine cvolustur.online bağlanıyor..."
railway domain --service frontend

Write-Host @"

  Özel domain için DNS kayıtlarını ekle:
  ┌─────────────────────────────────────────────────────────────┐
  │ Type   Host        Value                                     │
  ├─────────────────────────────────────────────────────────────┤
  │ CNAME  @           <railway-frontend-url>.up.railway.app    │
  │ CNAME  www         <railway-frontend-url>.up.railway.app    │
  └─────────────────────────────────────────────────────────────┘

  DNS Sağlayıcın: Namecheap / GoDaddy / Cloudflare vb.
  NOT: Railway özel domain için otomatik SSL sağlar.

"@ -ForegroundColor Cyan

# ─── ADIM 10: Deploy sonrası URL güncellemesi ────────────────────────────────
Write-Step "ADIM 10: Servis URL'lerini güncelle"
Write-Host @"

  Deploy tamamlandıktan sonra gerçek URL'leri al ve şu komutları çalıştır:

  # Backend URL'ini frontend'e ver:
  railway variables set "VITE_API_BASE_URL=https://GERCEK-BACKEND-URL.up.railway.app" --service frontend

  # PDF Service URL'ini frontend ve backend'e ver:
  railway variables set "VITE_PDF_SERVICE_URL=https://GERCEK-PDF-URL.up.railway.app" --service frontend
  railway variables set "PdfService__BaseUrl=http://pdf-service.railway.internal:3001" --service backend

  # Frontend URL'ini backend ve pdf-service'e ver:
  railway variables set "App__FrontendUrl=https://cvolustur.online" --service backend
  railway variables set "App__CorsOrigins__0=https://cvolustur.online" --service backend
  railway variables set "ALLOWED_ORIGINS=https://cvolustur.online" --service pdf-service

  # Frontend'i yeniden build et (env var değişti):
  railway redeploy --service frontend

"@ -ForegroundColor Green

Write-Host "`n✅ Kurulum tamamlandı!" -ForegroundColor Green
Write-Host "   Railway Dashboard: https://railway.app" -ForegroundColor Gray
Write-Host "   Loglar için: railway logs --service backend" -ForegroundColor Gray
