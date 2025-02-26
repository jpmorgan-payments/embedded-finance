'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Define the payment schema
export const paymentSchema = z.object({
  from: z.string().min(1, 'From account is required'),
  to: z.string().min(1, 'Recipient is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  method: z.string().min(1, 'Payment method is required'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Mock API call
const mockPostTransaction = async (
  data: PaymentFormData
): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Transaction data:', data);
      resolve({ success: true });
    }, 1000);
  });
};

export const usePaymentForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      from: '',
      to: '',
      amount: '',
      method: 'ACH',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      const result = await mockPostTransaction(data);
      if (result.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setIsSuccess(false);
  };

  return {
    form,
    onSubmit,
    isLoading,
    isSuccess,
    resetForm,
  };
};
