import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface InitiatePaymentRequest {
  planType: 'one_time' | 'monthly';
  fullName: string;
  email: string;
  phoneNumber?: string;
}

interface InitiatePaymentResponse {
  token: string;
  checkoutFormContent: string;
  paymentPageUrl?: string;
}

interface PaymentStatusResponse {
  plan: 'free' | 'paid';
  lastPaymentStatus?: string;
  paidAt?: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
}

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(
    async (request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post<InitiatePaymentResponse>('/api/payment/initiate', request);
        return response.data;
      } catch (err) {
        const msg = extractError(err, 'Ödeme başlatılamadı.');
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyPayment = useCallback(async (token: string): Promise<VerifyResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<VerifyResponse>(`/api/payment/verify/${token}`);
      return response.data;
    } catch (err) {
      const msg = extractError(err, 'Ödeme doğrulanamadı.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentStatus = useCallback(async (): Promise<PaymentStatusResponse> => {
    try {
      const response = await api.get<PaymentStatusResponse>('/api/payment/status');
      return response.data;
    } catch {
      return { plan: 'free' };
    }
  }, []);

  return { initiatePayment, verifyPayment, getPaymentStatus, isLoading, error };
}

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    if (e.response?.data?.error) return e.response.data.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
