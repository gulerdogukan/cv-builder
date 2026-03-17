/**
 * Shared mock data used across all E2E tests.
 * Mirrors the shape of backend DTOs / Supabase responses.
 */

export const TEST_USER = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'test@example.com',
  fullName: 'Test Kullanıcı',
  plan: 'free',
  createdAt: '2024-01-01T00:00:00Z',
};

export const TEST_USER_PAID = {
  ...TEST_USER,
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  email: 'paid@example.com',
  plan: 'paid',
};

export const MOCK_CV_LIST = [
  {
    id: 'cv-id-0001-0000-0000-000000000001',
    userId: TEST_USER.id,
    title: 'Yazılım Mühendisi CV',
    template: 'modern',
    language: 'tr',
    atsScore: 78,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-10T14:30:00Z',
  },
  {
    id: 'cv-id-0002-0000-0000-000000000002',
    userId: TEST_USER.id,
    title: 'Ürün Yöneticisi CV',
    template: 'klasik',
    language: 'tr',
    atsScore: 0,
    createdAt: '2024-05-20T09:00:00Z',
    updatedAt: '2024-05-25T11:00:00Z',
  },
];

export const MOCK_CV_DETAIL = {
  ...MOCK_CV_LIST[0],
  isPublic: false,
  data: {
    personal: {
      fullName: 'Test Kullanıcı',
      email: 'test@example.com',
      phone: '+90 555 000 0000',
      location: 'İstanbul',
    },
    summary: '5 yıl deneyimli yazılım mühendisi.',
    experience: [],
    education: [],
    skills: ['TypeScript', 'React', 'C#'],
    languages: [],
    certifications: [],
  },
};

export const NEW_CV = {
  id: 'cv-id-new0-0000-0000-000000000099',
  userId: TEST_USER.id,
  title: 'Yeni CV',
  template: 'modern',
  language: 'tr',
  atsScore: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPublic: false,
  data: {
    personal: { fullName: '', email: '', phone: '', location: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  },
};

/** Supabase session object stored in localStorage */
export const MOCK_SUPABASE_SESSION = {
  access_token: 'mock-access-token-playwright',
  refresh_token: 'mock-refresh-token',
  expires_at: 9_999_999_999,
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: TEST_USER.id,
    email: TEST_USER.email,
    user_metadata: { full_name: TEST_USER.fullName },
    app_metadata: { provider: 'email' },
    created_at: TEST_USER.createdAt,
    role: 'authenticated',
    aud: 'authenticated',
  },
};
