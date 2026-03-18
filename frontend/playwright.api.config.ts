import { defineConfig } from '@playwright/test';

/**
 * Playwright API Test Configuration
 *
 * Bu config sadece backend API testleri için kullanılır.
 * Frontend dev server gerekmez — doğrudan HTTP istekleri gönderilir.
 *
 * Kullanım:
 *   npx playwright test --config=playwright.api.config.ts
 *
 * Auth token ile (gerçek kullanıcı oturumu):
 *   AI_TEST_TOKEN=<supabase-jwt> npx playwright test --config=playwright.api.config.ts
 *
 * Farklı backend URL ile:
 *   API_BASE_URL=http://localhost:5001 npx playwright test --config=playwright.api.config.ts
 *
 * Sadece belirli bir endpoint:
 *   npx playwright test --config=playwright.api.config.ts --grep "enhance-text"
 */
export default defineConfig({
  testDir: './e2e/tests',
  testMatch: '**/ai-api.spec.ts',

  fullyParallel: false, // API rate limit'e çarpmamak için sıralı çalıştır
  retries: 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'e2e/report-api', open: 'never' }],
    ['list'],
  ],

  use: {
    // baseURL yok — testler absolute URL kullanır (API_BASE_URL env veya localhost:5001)
    actionTimeout:    15_000, // AI endpoint'leri yavaş olabilir
    navigationTimeout: 30_000,
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // webServer yok — frontend'e gerek olmadan çalışır
});
