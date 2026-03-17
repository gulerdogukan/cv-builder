# CvBuilder API — Plan-Based Integration Tests

## Test Coverage

### `FreePlanTests.cs` — Ücretsiz Plan
| Test | Beklenen Sonuç |
|------|----------------|
| CV listesi alma | 200 OK |
| CV oluşturma | 201 Created |
| CV güncelleme | 200 OK |
| CV silme | 204 No Content |
| PDF export | **402 Payment Required** (UPGRADE_REQUIRED) |
| Başka kullanıcının CV'si PDF | 402 (plan kontrolü önce gelir) |
| AI isteği (limit altında) | 200 OK |
| AI isteği (5/5 dolmuş) | **429 Too Many Requests** |
| 5 AI isteği → 6. bloklanır | 200×5, sonra 429 |
| Rate-limit endpoint (3 kullanıldı) | remaining=2 |
| Rate-limit endpoint (5 kullanıldı) | remaining=0 |
| Kimlik doğrulamasız istek | 401 Unauthorized |

### `PaidPlanTests.cs` — Aylık + Sınırsız Plan (PlanType.Paid)
| Test | Beklenen Sonuç |
|------|----------------|
| CV listesi alma | 200 OK |
| CV oluşturma | 201 Created |
| CV kopyalama | 201 Created |
| PDF export | **200 OK + PDF bytes** |
| Olmayan CV PDF | 404 Not Found |
| Başka kullanıcının CV'si PDF | 404 Not Found |
| AI isteği (100 kullanıldıktan sonra) | 200 OK (limit yok) |
| 10 AI isteği arka arkaya | Hepsi 200 OK |
| ATS skoru hesaplama | 200 OK |
| Rate-limit endpoint | isPaid=true, dailyLimit=null |
| Payment status | plan="paid" |
| Free vs Paid PDF karşılaştırması | 402 vs 200 |

### `PaymentFlowTests.cs` — Ödeme Akışı
| Test | Beklenen Sonuç |
|------|----------------|
| Aylık plan başlatma | 200 OK + token + form |
| Tek seferlik plan başlatma | 200 OK + token + form |
| Kimlik doğrulamasız ödeme | 401 Unauthorized |
| Ücretsiz kullanıcı payment status | plan="free" |
| Aylık ödeme sonrası status | plan="paid" |
| Tek seferlik ödeme sonrası status | plan="paid" |
| Eksik alanlarla ödeme başlatma | 400 Bad Request |
| Ücretsiz → Aylık geçiş (PDF kilidini açar) | 402 → 200 |
| Ücretsiz → Sınırsız geçiş (AI kilidini açar) | 429 → 200 |

## Testleri Çalıştırma

### Docker backend container içinde (önerilen)
```bash
docker exec -it cvbuilder-api bash -c "cd /src && dotnet test CvBuilder.Api.Tests --verbosity normal"
```

### Tüm testleri verbose çıktıyla
```bash
docker exec -it cvbuilder-api bash -c "cd /src && dotnet test CvBuilder.Api.Tests -v detailed"
```

### Sadece belirli bir test sınıfı
```bash
docker exec -it cvbuilder-api bash -c "cd /src && dotnet test CvBuilder.Api.Tests --filter 'FullyQualifiedName~FreePlanTests'"
docker exec -it cvbuilder-api bash -c "cd /src && dotnet test CvBuilder.Api.Tests --filter 'FullyQualifiedName~PaidPlanTests'"
docker exec -it cvbuilder-api bash -c "cd /src && dotnet test CvBuilder.Api.Tests --filter 'FullyQualifiedName~PaymentFlowTests'"
```

## Mimari

### Test Altyapısı
- **`CustomWebApplicationFactory`** — Test ortamı için uyarlanmış WebApplicationFactory:
  - PostgreSQL → EF Core InMemory ile değiştirilir
  - JWT Bearer → `TestAuthHandler` ile değiştirilir (X-Test-UserId header)
  - Anthropic AI, PDF servisi, Iyzico ödeme → mock implementasyonlarla değiştirilir

- **`TestAuthHandler`** — JWT token yerine `X-Test-UserId` header okuyan auth handler

- **`MockServices`** — Dış API çağrısı yapmayan mock servisler:
  - `MockAIService` — Sabit sonuçlar döner
  - `MockPdfService` — Gerçek PDF magic byte'ları döner
  - `MockPaymentService` — Iyzico çağrısı yapmaz; payment status gerçek DB'den okur

### Her Test
1. Benzersiz `Guid` ile kullanıcı oluşturur (test izolasyonu)
2. Kullanıcıyı test veritabanına seed eder (istenen plan ile)
3. `X-Test-UserId` header'lı HTTP client oluşturur
4. İstekleri gönderir ve HTTP status code + response body'yi doğrular
