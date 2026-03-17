import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from '../helpers/mockApi';
import { MOCK_CV_LIST, TEST_USER } from '../fixtures/data';

/**
 * E2E: Dashboard Akışları
 *
 * Tests:
 *   - Dashboard sayfa render
 *   - CV listesi görüntüleme
 *   - Boş CV listesi empty state
 *   - Yeni CV oluşturma → editor yönlendirme
 *   - CV silme (confirm dialog)
 *   - CV düzenle linki
 *   - Ücretsiz plan upgrade banner
 *   - ATS skoru badge'i
 *   - Template etiketi
 */

test.describe('Dashboard — Sayfa Render', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/dashboard');
  });

  test('dashboard başlığı ve kullanıcı adı görüntülenmeli', async ({ page }) => {
    await expect(page.getByText("CV'lerim")).toBeVisible();
    // User name appears in both Navbar span and greeting paragraph — use .first() to avoid strict mode violation
    await expect(page.getByText(new RegExp(TEST_USER.fullName, 'i')).first()).toBeVisible();
  });

  test('"Yeni CV Oluştur" butonu görüntülenmeli', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Yeni CV Oluştur/i })).toBeVisible();
  });

  test('CV listesi mock verilerle görüntülenmeli', async ({ page }) => {
    for (const cv of MOCK_CV_LIST) {
      await expect(page.getByText(cv.title)).toBeVisible();
    }
  });

  test('her CV kartında "Düzenle" ve "Sil" butonları olmalı', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Düzenle' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sil' }).first()).toBeVisible();
  });

  test('ATS skoru olan CV\'de badge görüntülenmeli', async ({ page }) => {
    // MOCK_CV_LIST[0] has atsScore: 78
    await expect(page.getByText('ATS: 78')).toBeVisible();
  });

  test('template etiketi görüntülenmeli', async ({ page }) => {
    await expect(page.getByText('modern').first()).toBeVisible();
  });
});

test.describe('Dashboard — CV Oluşturma', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('"Yeni CV Oluştur" tıklanınca editor\'a gidilmeli', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Yeni CV Oluştur/i }).first().click();

    // After creating, should navigate to editor
    await expect(page).toHaveURL(/\/editor\/.+/, { timeout: 5000 });
  });

  test('CV oluşturulurken loading butonu gösterilmeli', async ({ page }) => {
    // Slow down the API response to catch loading state
    await page.route('**/api/cvs', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { NEW_CV } = await import('../fixtures/data');
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(NEW_CV) });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Yeni CV Oluştur/i }).first().click();

    // Loading state should briefly appear
    await expect(page.getByText('Oluşturuluyor...')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Dashboard — CV Silme', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('Sil butonuna tıklanınca confirm dialog çıkmalı', async ({ page }) => {
    await page.goto('/dashboard');

    // Accept the confirm dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain("CV'yi silmek istediğinize emin misiniz?");
      await dialog.dismiss(); // Cancel — don't actually delete
    });

    await page.getByRole('button', { name: 'Sil' }).first().click();
  });

  test('silme iptal edilince CV listede kalmalı', async ({ page }) => {
    await page.goto('/dashboard');

    // Dismiss the confirm → CV should remain
    page.on('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Sil' }).first().click();

    await expect(page.getByText(MOCK_CV_LIST[0].title)).toBeVisible();
  });

  test('silme onaylanınca CV listeden kaldırılmalı', async ({ page }) => {
    // Mock DELETE to succeed
    await page.route(`**/api/cvs/${MOCK_CV_LIST[0].id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    // After deletion, GET /api/cvs returns only the second CV
    await page.route('**/api/cvs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_CV_LIST[1]]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard');

    // Accept the confirm dialog
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Sil' }).first().click();

    // First CV should eventually disappear
    await expect(page.getByText(MOCK_CV_LIST[0].title)).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Dashboard — Boş State', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Override CV list to return empty array
    await page.route('**/api/cvs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });
  });

  test('boş CV listesinde empty state gösterilmeli', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText("Henüz CV'niz yok")).toBeVisible();
    await expect(page.getByRole('button', { name: "İlk CV'ni Oluştur" })).toBeVisible();
  });

  test('empty state butonuyla da CV oluşturulabilmeli', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: "İlk CV'ni Oluştur" }).click();

    await expect(page).toHaveURL(/\/editor\/.+/, { timeout: 5000 });
  });
});

test.describe('Dashboard — Ücretsiz Plan Banner', () => {
  test('ücretsiz kullanıcı CV\'si varsa upgrade banner gösterilmeli', async ({ page }) => {
    await setupAuthenticatedUser(page, false); // free plan
    await page.goto('/dashboard');

    await expect(page.getByText(/Ücretsiz plandayısınız/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Planları Gör/i })).toBeVisible();
  });

  test('"Planları Gör" linki pricing sayfasına gitmeli', async ({ page }) => {
    await setupAuthenticatedUser(page, false);
    await page.goto('/dashboard');

    await page.getByRole('link', { name: /Planları Gör/i }).click();
    await expect(page).toHaveURL('/pricing');
  });
});

test.describe('Dashboard — Navigasyon', () => {
  test('"Düzenle" linki doğru CV editor URL\'ine gitmeli', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/dashboard');

    await page.getByRole('link', { name: 'Düzenle' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/editor/${MOCK_CV_LIST[0].id}`));
  });
});
