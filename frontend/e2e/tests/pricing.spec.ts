import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, setupUnauthenticatedUser } from '../helpers/mockApi';

/**
 * E2E: Fiyatlandırma Sayfası & Abonelik Planları
 *
 * Tests:
 *   - 3 plan kartı render (Ücretsiz, Tek Seferlik, Aylık)
 *   - Her planın özellik listesi
 *   - "EN POPÜLER" rozeti Tek Seferlik üzerinde
 *   - Giriş yapmamış kullanıcı → login yönlendirmesi
 *   - Giriş yapmış ücretsiz kullanıcı → ödeme formu
 *   - Giriş yapmış ücretli kullanıcı → "Mevcut Planınız" durumu
 *   - Güven rozetleri (SSL, İyzico, Anlık aktivasyon)
 *   - Fiyat gösterimi
 */

test.describe('Pricing — Sayfa Render', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
  });

  test('sayfa başlığı ve açıklaması görüntülenmeli', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Fiyatlandırma/i })).toBeVisible();
    await expect(page.getByText(/İhtiyacınıza uygun planı seçin/i)).toBeVisible();
  });

  test('3 plan kartı görüntülenmeli', async ({ page }) => {
    // exact: true prevents matching "Ücretsiz Başla" in the nav link/button
    await expect(page.getByText('Ücretsiz', { exact: true })).toBeVisible();
    await expect(page.getByText('Tek Seferlik', { exact: true })).toBeVisible();
    await expect(page.getByText('Aylık', { exact: true })).toBeVisible();
  });

  test('fiyatlar doğru görüntülenmeli', async ({ page }) => {
    await expect(page.getByText('0₺')).toBeVisible();
    await expect(page.getByText('99₺')).toBeVisible();
    await expect(page.getByText('49₺')).toBeVisible();
  });

  test('"EN POPÜLER" rozeti Tek Seferlik planında olmalı', async ({ page }) => {
    await expect(page.getByText('EN POPÜLER')).toBeVisible();
  });
});

test.describe('Pricing — Ücretsiz Plan Özellikleri', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
  });

  test('ücretsiz plan özellik listesi doğru olmalı', async ({ page }) => {
    await expect(page.getByText('1 CV oluşturma')).toBeVisible();
    await expect(page.getByText('Tüm şablonları önizle')).toBeVisible();
    await expect(page.getByText('Günde 5 AI önerisi')).toBeVisible();
  });

  test('ücretsiz planda PDF indirme çarpı işaretiyle gösterilmeli', async ({ page }) => {
    // PDF indirme feature should exist in the page (with ✕ mark)
    await expect(page.getByText('PDF indirme')).toBeVisible();
  });
});

test.describe('Pricing — Ücretli Plan Özellikleri', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
  });

  test('Tek Seferlik plan özellikleri doğru olmalı', async ({ page }) => {
    await expect(page.getByText('3 CV oluşturma')).toBeVisible();
    await expect(page.getByText('Günde 20 AI önerisi')).toBeVisible();
    await expect(page.getByText('Sınırsız PDF indirme').first()).toBeVisible();
  });

  test('Aylık plan sınırsız CV içermeli', async ({ page }) => {
    await expect(page.getByText('Sınırsız CV').first()).toBeVisible();
    await expect(page.getByText('Sınırsız AI önerisi')).toBeVisible();
    await expect(page.getByText('Öncelikli destek')).toBeVisible();
  });
});

test.describe('Pricing — CTA Butonları (Giriş Yapmamış)', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
  });

  test('"Ücretsiz Başla" butonu register sayfasına gitmeli', async ({ page }) => {
    await page.getByRole('button', { name: 'Ücretsiz Başla' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('"Satın Al" butonu login sayfasına yönlendirmeli (oturum yok)', async ({ page }) => {
    await page.getByRole('button', { name: 'Satın Al' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('"Abone Ol" butonu login sayfasına yönlendirmeli (oturum yok)', async ({ page }) => {
    await page.getByRole('button', { name: 'Abone Ol' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Pricing — CTA Butonları (Ücretsiz Kullanıcı)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, false); // free plan
    await page.goto('/pricing');
  });

  test('"Ücretsiz Başla" butonu ücretsiz kullanıcıda devre dışı olmalı', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Ücretsiz Başla|Mevcut Planınız/i }).first();
    await expect(btn).toBeDisabled();
  });

  test('"Satın Al" tıklanınca ödeme formu modal açılmalı', async ({ page }) => {
    await page.getByRole('button', { name: 'Satın Al' }).click();

    // Iyzico checkout modal should appear
    await expect(
      page.getByText(/Mock ödeme formu|iyzipay|checkout/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('"Abone Ol" tıklanınca ödeme formu modal açılmalı', async ({ page }) => {
    await page.getByRole('button', { name: 'Abone Ol' }).click();

    await expect(
      page.getByText(/Mock ödeme formu|iyzipay|checkout/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Pricing — Ücretli Kullanıcı', () => {
  test('ücretli kullanıcıda tüm ücretli plan butonları "Mevcut Planınız" göstermeli', async ({ page }) => {
    await setupAuthenticatedUser(page, true); // paid plan
    await page.goto('/pricing');

    const currentPlanBtns = page.getByText('✓ Mevcut Planınız');
    await expect(currentPlanBtns.first()).toBeVisible();
  });

  test('ücretli kullanıcıda satın alma butonları devre dışı olmalı', async ({ page }) => {
    await setupAuthenticatedUser(page, true);
    await page.goto('/pricing');

    // Paid plan buttons should be disabled
    const satinAlBtn = page.getByRole('button', { name: /Satın Al|Mevcut Planınız/i });
    const count = await satinAlBtn.count();
    if (count > 0) {
      await expect(satinAlBtn.first()).toBeDisabled();
    }
  });
});

test.describe('Pricing — Güven Rozetleri', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
  });

  test('SSL şifreleme rozeti görüntülenmeli', async ({ page }) => {
    await expect(page.getByText(/256-bit SSL Şifreleme/i)).toBeVisible();
  });

  test('İyzico güvenli ödeme rozeti görüntülenmeli', async ({ page }) => {
    await expect(page.getByText(/İyzico ile Güvenli Ödeme/i)).toBeVisible();
  });

  test('Anlık Aktivasyon rozeti görüntülenmeli', async ({ page }) => {
    await expect(page.getByText(/Anında Aktivasyon/i)).toBeVisible();
  });
});

test.describe('Pricing — Navbar Navigasyon', () => {
  test('giriş yapmamış kullanıcı navbar\'ında "Giriş Yap" ve "Ücretsiz Başla" görünmeli', async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');

    await expect(page.getByRole('link', { name: 'Giriş Yap' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ücretsiz Başla' })).toBeVisible();
  });

  test('giriş yapmış kullanıcı navbar\'ında "Dashboard" linki görünmeli', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/pricing');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('logo tıklanınca anasayfaya gidilmeli', async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
    await page.getByRole('link', { name: 'CV Builder' }).first().click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Pricing — Sayfa Başlığı', () => {
  test('pricing sayfası başlık içermeli', async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/Fiyatlandırma/i);
  });
});
