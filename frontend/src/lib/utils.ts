import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const monthIndex = parseInt(month ?? '1', 10) - 1;
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
