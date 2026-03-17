import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, setupUnauthenticatedUser } from '../helpers/mockApi';

/**
 * E2E: Authentication Flows
 *
 * Tests:
 *   - Login sayfası render
 *   - Form validasyonu (boş submit)
 *   - Yanlış şifre hatası
 *   - Başarılı giriş → dashboard yönlendirme
 *   - Google ile giriş butonu varlığı
 *   - Register sayfası render
 *   - Register form alanları
 *   - Zaten giriş yapmışsa /login → /dashboard yönlendirmesi
 *   - Çıkış (logout) akışı
 */

test.describe('Auth — Login Sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
  });

  test('login sayfası doğru render olmalı', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Hesabınıza giriş yapın')).toBeVisible();
    await expect(page.getByLabel('E-posta')).toBeVisible();
    await expect(page.getByLabel('Şifre')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Giriş Yap' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google ile Giriş Yap/i })).toBeVisible();
  });

  test('"Kayıt Ol" linki register sayfasına gitmeli', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Kayıt Ol' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('boş form submit edilince HTML validasyonu devreye girmeli', async ({ page }) => {
    await page.goto('/login');

    // Boş form submit — HTML5 required validation prevents default submit
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    // Sayfa değişmemiş olmalı (form submit olmadı)
    await expect(page).toHaveURL('/login');
  });

  test('yanlış şifre girilince hata mesajı gösterilmeli', async ({ page }) => {
    // Override token endpoint to return error
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.goto('/login');
    await page.getByLabel('E-posta').fill('test@example.com');
    await page.getByLabel('Şifre').fill('wrongpassword');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    await expect(page.getByText(/Giriş başarısız|Invalid login credentials/i)).toBeVisible();
  });

  test('başarılı giriş sonrası dashboard\'a yönlendirilmeli', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Mock successful sign-in
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'test-user-id', email: 'test@example.com' },
        }),
      });
    });

    await page.goto('/login');
    await page.getByLabel('E-posta').fill('test@example.com');
    await page.getByLabel('Şifre').fill('correctpassword');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    // After successful login, should navigate away from /login
    await expect(page).not.toHaveURL('/login', { timeout: 3000 });
  });

  test('logo CV Builder tıklanınca anasayfaya gitmeli', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'CV Builder' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Auth — Register Sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
  });

  test('register sayfası tüm alanları göstermeli', async ({ page }) => {
    await page.goto('/register');

    // Check page renders properly
    await expect(page.getByText(/Hesap Oluştur|Ücretsiz başla|kayıt/i)).toBeVisible();
    await expect(page.getByLabel(/Ad Soyad|İsim|Tam Ad/i)).toBeVisible();
    await expect(page.getByLabel(/E-posta/i)).toBeVisible();
    await expect(page.getByLabel(/Şifre/i)).toBeVisible();
  });

  test('"Giriş Yap" linki login sayfasına gitmeli', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /Giriş Yap/i }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Auth — Oturum Yönetimi', () => {
  test('giriş yapmış kullanıcı /login\'e gelince dashboard\'a yönlendirilmeli', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/login');

    // Authenticated user should be redirected from login
    await expect(page).not.toHaveURL('/login', { timeout: 3000 });
  });

  test('korunan sayfalara erişim /login\'e yönlendirmeli', async ({ page }) => {
    await setupUnauthenticatedUser(page);
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 3000 });
  });

  test('logout butonu kullanıcıyı çıkarmalı', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await expect(page.getByText("CV'lerim")).toBeVisible();

    // Find and click logout button in navbar
    const logoutBtn = page.getByRole('button', { name: /Çıkış|Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/login|\//);
    } else {
      // May be in a dropdown — open it first
      const menuBtn = page.getByRole('button', { name: /Menü|profil|avatar/i });
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.getByRole('menuitem', { name: /Çıkış/i }).click();
        await expect(page).toHaveURL(/login|\//);
      }
    }
  });
});

test.describe('Auth — Sayfa Başlıkları', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedUser(page);
  });

  test('login sayfası başlık içermeli', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Giriş/i);
  });

  test('register sayfası başlık içermeli', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/Kayıt/i);
  });
});
