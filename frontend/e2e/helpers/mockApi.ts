import type { Page, Route } from '@playwright/test';
import {
  MOCK_CV_DETAIL,
  MOCK_CV_LIST,
  MOCK_SUPABASE_SESSION,
  NEW_CV,
  TEST_USER,
  TEST_USER_PAID,
} from '../fixtures/data';

// ── JSON helper ──────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

// ── Auth injection ────────────────────────────────────────────────────────────

/**
 * Injects a mock Supabase session into localStorage BEFORE the page scripts run.
 *
 * Supabase JS v2 stores the raw session object (NOT wrapped in { currentSession, expiresAt }).
 * The storage key is: "sb-{project-ref}-auth-token"
 * With VITE_SUPABASE_URL empty → falls back to "https://placeholder.supabase.co"
 * → project-ref = "placeholder" → key = "sb-placeholder-auth-token"
 *
 * Two-layer strategy for reliability:
 *  1. localStorage.setItem with the exact key (primary — works before Supabase inits)
 *  2. Storage.prototype.getItem override matching any sb-*-auth-token key (fallback)
 */
export async function injectAuthSession(page: Page, paid = false) {
  const session = paid
    ? { ...MOCK_SUPABASE_SESSION, user: { ...MOCK_SUPABASE_SESSION.user, id: TEST_USER_PAID.id, email: TEST_USER_PAID.email } }
    : MOCK_SUPABASE_SESSION;

  // Supabase JS v2 format: raw session object (no wrapper)
  const sessionJson = JSON.stringify(session);

  // Key derivation: sb-{hostname.split('.')[0]}-auth-token
  // "https://placeholder.supabase.co" → "placeholder" → "sb-placeholder-auth-token"
  const storageKey = 'sb-placeholder-auth-token';

  await page.addInitScript(({ key, value }: { key: string; value: string }) => {
    // Primary: set directly so Supabase reads it during getSession() on init
    try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }

    // Fallback: intercept prototype so ANY sb-*-auth-token lookup returns our session
    const _orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k: string): string | null {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) return value;
      return _orig.call(this, k);
    };
  }, { key: storageKey, value: sessionJson });
}

// ── Supabase API mocks ────────────────────────────────────────────────────────

/**
 * Mocks all Supabase REST/auth API endpoints.
 * Prevents real network calls to *.supabase.co
 */
export async function mockSupabaseAuth(page: Page, paid = false) {
  const user = paid ? TEST_USER_PAID : TEST_USER;
  const session = paid
    ? { ...MOCK_SUPABASE_SESSION, user: { ...MOCK_SUPABASE_SESSION.user, id: user.id, email: user.email } }
    : MOCK_SUPABASE_SESSION;

  // GET /auth/v1/user — Supabase getUser()
  await page.route('**/auth/v1/user', async (route: Route) => {
    await route.fulfill(json(session.user));
  });

  // POST /auth/v1/token — Supabase signInWithPassword / refreshSession
  await page.route('**/auth/v1/token**', async (route: Route) => {
    await route.fulfill(json(session));
  });

  // POST /auth/v1/signup — Supabase signUp
  await page.route('**/auth/v1/signup', async (route: Route) => {
    await route.fulfill(json({ ...session, user: { ...session.user, email: 'new@example.com' } }));
  });

  // POST /auth/v1/logout — Supabase signOut
  await page.route('**/auth/v1/logout', async (route: Route) => {
    await route.fulfill(json({}));
  });

  // Supabase realtime / websocket — just block
  await page.route('**/realtime/**', async (route: Route) => {
    await route.abort();
  });
}

// ── Backend API mocks ─────────────────────────────────────────────────────────

/**
 * Mocks all backend API endpoints (localhost:5000 / /api/*).
 * Simulates a complete, working backend without needing Docker.
 */
export async function mockBackendApi(page: Page, paid = false) {
  const user = paid ? TEST_USER_PAID : TEST_USER;

  // POST /api/auth/verify-token
  await page.route('**/api/auth/verify-token', async (route: Route) => {
    await route.fulfill(json({
      userId:   user.id,
      email:    user.email,
      fullName: user.fullName,
      plan:     user.plan,
    }));
  });

  // GET /api/cvs
  await page.route('**/api/cvs', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill(json(MOCK_CV_LIST));
    } else if (route.request().method() === 'POST') {
      await route.fulfill(json(NEW_CV, 201));
    } else {
      await route.continue();
    }
  });

  // GET/PUT/DELETE /api/cvs/:id
  await page.route('**/api/cvs/**', async (route: Route) => {
    const method = route.request().method();
    const url    = route.request().url();

    if (url.includes('/duplicate')) {
      await route.fulfill(json({ ...NEW_CV, id: 'cv-id-dup0', title: 'Yazılım Mühendisi CV (Kopya)' }, 201));
    } else if (method === 'GET') {
      await route.fulfill(json(MOCK_CV_DETAIL));
    } else if (method === 'PUT') {
      const body = await route.request().postDataJSON().catch(() => ({}));
      await route.fulfill(json({ ...MOCK_CV_DETAIL, ...body }));
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });

  // POST /api/ai/enhance-text
  await page.route('**/api/ai/enhance-text', async (route: Route) => {
    await route.fulfill(json({ enhanced: '[GELİŞTİRİLDİ] Test metni', remainingRequests: paid ? null : 4 }));
  });

  // POST /api/ai/ats-score
  await page.route('**/api/ai/ats-score', async (route: Route) => {
    await route.fulfill(json({ score: 78, suggestions: ['Ölçülebilir başarılar ekleyin'], remainingRequests: paid ? null : 4 }));
  });

  // GET /api/ai/rate-limit
  await page.route('**/api/ai/rate-limit', async (route: Route) => {
    await route.fulfill(json({
      isPaid:     paid,
      dailyLimit: paid ? null : 5,
      used:       paid ? 0 : 1,
      remaining:  paid ? null : 4,
      resetAt:    new Date(Date.now() + 86_400_000).toISOString(),
    }));
  });

  // GET /api/payment/status
  await page.route('**/api/payment/status', async (route: Route) => {
    await route.fulfill(json({ plan: user.plan, lastPaymentStatus: null, paidAt: null }));
  });

  // POST /api/payment/initiate
  await page.route('**/api/payment/initiate', async (route: Route) => {
    await route.fulfill(json({
      token: 'mock-iyzico-token',
      checkoutFormContent: '<div id="iyzipay-checkout-form"><p>Mock ödeme formu</p></div>',
    }));
  });

  // POST /api/pdf/:id/export — blocked for free, allowed for paid
  await page.route('**/api/pdf/**/export', async (route: Route) => {
    if (paid) {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
      });
    } else {
      await route.fulfill(json({ error: 'PDF indirme özelliği sadece Premium kullanıcılara açıktır.', code: 'UPGRADE_REQUIRED' }, 402));
    }
  });
}

// ── Combined setup ────────────────────────────────────────────────────────────

/**
 * Full E2E setup: injects auth session + mocks all APIs.
 * Call this at the start of each test that requires authentication.
 */
export async function setupAuthenticatedUser(page: Page, paid = false) {
  await injectAuthSession(page, paid);
  await mockSupabaseAuth(page, paid);
  await mockBackendApi(page, paid);
}

/**
 * Setup for unauthenticated tests.
 * Mocks Supabase to return no session (logged-out state).
 */
export async function setupUnauthenticatedUser(page: Page) {
  // No session injection — Supabase returns empty
  await page.route('**/auth/v1/user', async (route: Route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Invalid JWT"}' });
  });

  await page.route('**/auth/v1/token**', async (route: Route) => {
    await route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_grant"}' });
  });

  await page.route('**/realtime/**', async (route: Route) => {
    await route.abort();
  });
}
