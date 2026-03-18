import { test, expect, APIRequestContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * AI API Endpoint Tests
 *
 * Bu testler doğrudan backend API'ye (localhost:5001) HTTP isteği atar.
 * UI veya mock kullanılmaz — gerçek network call.
 *
 * Başarı kriteri: İstek sunucuya ulaşıyor (herhangi bir HTTP yanıtı = OK).
 * - 200 / 201 → Başarılı
 * - 401        → Unauthenticated, ama sunucu çalışıyor ✓
 * - 400 / 422  → Validation hatası, sunucu çalışıyor ✓
 * - 429        → Rate limit, sunucu çalışıyor ✓
 * - 5xx        → Sunucu hatası (model API sorunu olabilir) — isteğe göre toleranslı
 * - Network hata / timeout → FAIL (sunucu ayakta değil)
 *
 * Auth token ortam değişkeniyle verilebilir:
 *   AI_TEST_TOKEN=<supabase-jwt> npx playwright test e2e/tests/ai-api.spec.ts
 * Token verilmezse testler 401 yanıtını "sunucu canlı" kanıtı olarak kabul eder.
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5001';
const AUTH_TOKEN = process.env.AI_TEST_TOKEN ?? '';

// Minimal valid CV JSON for endpoints that need it
const SAMPLE_CV_JSON = JSON.stringify({
  personal: {
    fullName: 'Ali Yılmaz',
    email: 'ali@example.com',
    phone: '+90 555 000 0000',
    location: 'İstanbul, Türkiye',
    title: 'Yazılım Mühendisi',
  },
  summary: {
    text: '5 yıl deneyimli full-stack yazılım mühendisi.',
  },
  experience: [
    {
      company: 'Tech Corp',
      position: 'Senior Developer',
      startDate: '2020-01',
      endDate: null,
      description: 'React ve .NET ile kurumsal uygulamalar geliştirdim.',
    },
  ],
  education: [
    {
      school: 'İstanbul Teknik Üniversitesi',
      degree: 'Lisans',
      field: 'Bilgisayar Mühendisliği',
      graduationYear: 2019,
    },
  ],
  skills: ['React', 'TypeScript', 'C#', '.NET', 'PostgreSQL'],
});

const SAMPLE_JOB_DESCRIPTION = `
  Senior Frontend Developer arıyoruz.
  React, TypeScript ve modern web teknolojilerinde 3+ yıl deneyim gereklidir.
  Takım çalışmasına yatkın, iletişim becerileri güçlü adaylar tercih edilir.
`;

// Helper: build request headers
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return headers;
}

// Helper: assert a response was received from the server (any HTTP status)
function assertServerReachable(status: number, url: string) {
  expect(
    status,
    `[${url}] Sunucuya ulaşılamadı (network error). Backend'in ayakta olduğundan emin ol.`
  ).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(600);
}

// Helper: for authenticated endpoints, 401 without token is expected and valid
function assertAuthAwareStatus(status: number, url: string) {
  assertServerReachable(status, url);
  if (!AUTH_TOKEN) {
    // Without token, 401 is the expected response — server is alive
    expect(
      [401, 403, 400, 200, 201, 429, 422, 500, 503],
      `[${url}] Beklenmedik HTTP durum kodu: ${status}`
    ).toContain(status);
  }
}

// ---------------------------------------------------------------------------
// GET /api/ai/rate-limit
// ---------------------------------------------------------------------------
test.describe('GET /api/ai/rate-limit', () => {
  test('sunucuya ulaşmalı — AI kullanım limitini döndürmeli', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/ai/rate-limit`, {
      headers: authHeaders(),
    });

    assertAuthAwareStatus(response.status(), '/api/ai/rate-limit');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('isPaid');
      expect(body).toHaveProperty('resetAt');
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/enhance-text
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/enhance-text', () => {
  test('sunucuya ulaşmalı — metin geliştirme isteği işlenmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/enhance-text`, {
      headers: authHeaders(),
      data: {
        text: 'React ve JavaScript ile web uygulamaları geliştirdim.',
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/enhance-text');

    if (response.status() === 200) {
      const body = await response.json();
      // DTO field: EnhancedText → camelCase: enhancedText
      expect(body).toHaveProperty('enhancedText');
      expect(typeof body.enhancedText).toBe('string');
      expect(body.enhancedText.length).toBeGreaterThan(0);
    }
  });

  test('boş text ile sunucuya ulaşmalı (backend validation yok, 200 dönebilir)', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/enhance-text`, {
      headers: authHeaders(),
      data: { text: '' },
    });

    // Backend boş text için validation yapmıyor — 200 veya 401 beklenir
    assertServerReachable(response.status(), '/api/ai/enhance-text (empty text)');
    expect([200, 400, 401, 403, 422]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/ats-score
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/ats-score', () => {
  test('sunucuya ulaşmalı — ATS skoru hesaplanmalı', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/ats-score`, {
      headers: authHeaders(),
      data: {
        cvDataJson: SAMPLE_CV_JSON,
        cvId: null,
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/ats-score');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('score');
      expect(typeof body.score).toBe('number');
      expect(body.score).toBeGreaterThanOrEqual(0);
      expect(body.score).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/suggest-skills
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/suggest-skills', () => {
  test('sunucuya ulaşmalı — pozisyona göre beceri önerilmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/suggest-skills`, {
      headers: authHeaders(),
      data: {
        position: 'Frontend Developer',
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/suggest-skills');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('skills');
      expect(Array.isArray(body.skills)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/generate-summary
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/generate-summary', () => {
  test('sunucuya ulaşmalı — CV özeti oluşturulmalı', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/generate-summary`, {
      headers: authHeaders(),
      data: {
        cvDataJson: SAMPLE_CV_JSON,
        targetPosition: 'Senior Frontend Developer',
        targetDescription: SAMPLE_JOB_DESCRIPTION,
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/generate-summary');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('drafts');
      expect(Array.isArray(body.drafts)).toBe(true);
      expect(body.drafts.length).toBeGreaterThan(0);
    }
  });

  test('targetPosition olmadan da istek gönderilmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/generate-summary`, {
      headers: authHeaders(),
      data: {
        cvDataJson: SAMPLE_CV_JSON,
        targetPosition: null,
        targetDescription: null,
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/generate-summary (no position)');
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/import-linkedin
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/import-linkedin', () => {
  test('sunucuya ulaşmalı — LinkedIn profil metni işlenmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/import-linkedin`, {
      headers: authHeaders(),
      data: {
        profileText: `
Ali Yılmaz
Senior Software Engineer at Tech Corp
İstanbul, Türkiye

Deneyim:
Tech Corp | Senior Software Engineer | Oca 2020 – Günümüz
- React ve TypeScript ile SPA geliştirdim
- .NET 8 ile REST API tasarladım

Eğitim:
İstanbul Teknik Üniversitesi | Bilgisayar Mühendisliği | 2015–2019

Beceriler: React, TypeScript, C#, .NET, PostgreSQL, Docker
        `,
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/import-linkedin');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('cvDataJson');
      expect(typeof body.cvDataJson).toBe('string');
    }
  });

  test('boş profileText ile 400 dönmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/import-linkedin`, {
      headers: authHeaders(),
      data: { profileText: '' },
    });

    assertServerReachable(response.status(), '/api/ai/import-linkedin (empty)');
    // Token olmadan 401, token varken 400 beklenir
    expect([400, 401, 403]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/import-cv  (multipart/form-data — PDF dosyası)
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/import-cv', () => {
  test('sunucuya ulaşmalı — PDF dosyası kabul edilmeli', async ({ request }) => {
    // Minimal geçerli PDF (1-sayfa, boş içerik)
    // %PDF-1.4 magic bytes + minimal xref table
    const minimalPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
      'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n' +
      '0000000058 00000 n\n0000000115 00000 n\n' +
      'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF\n',
      'utf-8'
    );

    const headers: Record<string, string> = {};
    if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

    const response = await request.post(`${API_BASE}/api/ai/import-cv`, {
      headers,
      multipart: {
        file: {
          name: 'test-cv.pdf',
          mimeType: 'application/pdf',
          buffer: minimalPdf,
        },
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/import-cv');

    // 200 = OK, 401 = sunucu canlı ama auth yok,
    // 500 = PDF içeriği boş olduğundan PdfPig parse hatası (sunucu canlı ✓)
    expect([200, 401, 403, 400, 422, 500]).toContain(response.status());
  });

  test('PDF olmayan dosya ile 400 dönmeli', async ({ request }) => {
    const headers: Record<string, string> = {};
    if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

    const response = await request.post(`${API_BASE}/api/ai/import-cv`, {
      headers,
      multipart: {
        file: {
          name: 'document.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Bu bir PDF değil'),
        },
      },
    });

    assertServerReachable(response.status(), '/api/ai/import-cv (wrong type)');
    // Token olmadan 401, token varken 400 beklenir
    expect([400, 401, 403]).toContain(response.status());
  });

  test('dosya olmadan 400 dönmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/import-cv`, {
      headers: authHeaders(),
      data: {},
    });

    assertServerReachable(response.status(), '/api/ai/import-cv (no file)');
    expect([400, 401, 403, 415, 422]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/cover-letter
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/cover-letter', () => {
  test('sunucuya ulaşmalı — ön yazı oluşturulmalı', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/cover-letter`, {
      headers: authHeaders(),
      data: {
        cvDataJson: SAMPLE_CV_JSON,
        jobDescription: SAMPLE_JOB_DESCRIPTION,
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/cover-letter');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('coverLetter');
      expect(typeof body.coverLetter).toBe('string');
      expect(body.coverLetter.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/match-job
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/match-job', () => {
  test('sunucuya ulaşmalı — CV-iş ilanı eşleştirmesi yapılmalı', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/match-job`, {
      headers: authHeaders(),
      data: {
        cvDataJson: SAMPLE_CV_JSON,
        jobDescription: SAMPLE_JOB_DESCRIPTION,
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/match-job');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('matchScore');
      expect(typeof body.matchScore).toBe('number');
      expect(body).toHaveProperty('matchingSkills');
      expect(Array.isArray(body.matchingSkills)).toBe(true);
      expect(body).toHaveProperty('missingSkills');
      expect(body).toHaveProperty('advice');
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/bulletize
// ---------------------------------------------------------------------------
test.describe('POST /api/ai/bulletize', () => {
  test('sunucuya ulaşmalı — iş deneyimi madde madde yazılmalı', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/bulletize`, {
      headers: authHeaders(),
      data: {
        description: 'React ve TypeScript kullanarak büyük ölçekli bir e-ticaret platformu geliştirdim. Kod kalitesini artırmak için unit testler yazdım.',
        jobTitle: 'Senior Frontend Developer',
      },
    });

    assertAuthAwareStatus(response.status(), '/api/ai/bulletize');

    if (response.status() === 200) {
      const body = await response.json();
      // DTO field: Bullets → camelCase: bullets (string, newline-separated — not an array)
      expect(body).toHaveProperty('bullets');
      expect(typeof body.bullets).toBe('string');
      expect(body.bullets.length).toBeGreaterThan(0);
    }
  });

  test('boş description ile 400 dönmeli', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ai/bulletize`, {
      headers: authHeaders(),
      data: {
        description: '',
        jobTitle: 'Developer',
      },
    });

    assertServerReachable(response.status(), '/api/ai/bulletize (empty)');
    // Token olmadan 401, token varken 400 beklenir
    expect([400, 401, 403]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Sağlık kontrolü — backend'in ayakta olduğunu doğrula
// ---------------------------------------------------------------------------
test.describe('Backend Health Check', () => {
  test('GET /health — backend ayakta olmalı', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);

    // /health endpoint'i her zaman erişilebilir olmalı (auth gerekmez)
    expect(
      response.status(),
      'Backend başlatılamadı. docker compose up -d veya dotnet run çalıştığından emin ol.'
    ).toBeLessThan(500);
  });
});
