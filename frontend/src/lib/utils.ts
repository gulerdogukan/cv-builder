import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr.trim() === '') return '';
  const parts = dateStr.split('-');
  const year  = parts[0];
  const month = parts[1];

  // Yıl yoksa veya geçersizse ham string dön
  if (!year || !/^\d{4}$/.test(year)) return dateStr;

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const monthIndex = parseInt(month ?? '1', 10) - 1;
  // monthIndex aralık dışıysa sadece yılı göster
  if (monthIndex < 0 || monthIndex > 11) return year;
  return `${months[monthIndex]} ${year}`;
}

export type DebouncedFn<T extends (...args: unknown[]) => void> = {
  (...args: Parameters<T>): void;
  /** Bekleyen çağrıyı iptal eder — unmount'ta memory leak önlenir */
  cancel: () => void;
};

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): DebouncedFn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };
  return debounced;
}
