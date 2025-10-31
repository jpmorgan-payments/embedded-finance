'use client';

import { useCallback, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { PaymentFormData } from '../types';

// Define the payment schema
export const paymentSchema = z
  .object({
    from: z.string().min(1, 'From account is required'),
    recipientMode: z.enum(['existing', 'manual']).default('existing'),
    to: z.string().optional(),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .regex(/^[\d]+(\.\d{1,2})?$/, 'Invalid amount format'),
    method: z.string().min(1, 'Payment method is required'),
    currency: z.string().min(1, 'Currency is required'),
    memo: z.string().optional(),

    // Manual recipient fields (validated when recipientMode === 'manual')
    partyType: z.enum(['INDIVIDUAL', 'ORGANIZATION']).optional(),
    firstName: z.string().max(70).optional(),
    lastName: z.string().max(70).optional(),
    businessName: z.string().max(140).optional(),
    accountType: z.enum(['CHECKING', 'SAVINGS', 'IBAN']).optional(),
    accountNumber: z
      .string()
      .optional()
      .superRefine((value, ctx) => {
        const { parent } = ctx as unknown as {
          parent?: { accountType?: string };
        };
        if (!value) return;
        const trimmed = value.trim();
        if (!trimmed) return;
        if (parent?.accountType === 'IBAN') {
          if (!/^[A-Z0-9]{1,35}$/.test(trimmed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'IBAN must contain only letters and numbers and be 1-35 characters long',
            });
          }
          return;
        }
        if (!/^[0-9]{4,17}$/.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Account number must be 4-17 digits',
          });
        }
      }),
    countryCode: z.enum(['US']).default('US').optional(),
    // One routing number captured per selected method; US ABA 9 digits
    routingNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9]{9}$/.test(val),
        'Routing number must be 9 digits'
      ),
    // RTP and WIRE require address
    addressLine1: z.string().max(34).optional(),
    city: z.string().max(34).optional(),
    state: z.string().max(30).optional(),
    postalCode: z.string().max(10).optional(),
  })
  .superRefine((data, ctx) => {
    // Recipient selection rules
    if (data.recipientMode === 'existing') {
      if (!data.to || data.to.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recipient is required',
          path: ['to'],
        });
      }
      return;
    }

    // Manual mode validation
    if (!data.partyType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Party type is required',
        path: ['partyType'],
      });
    } else if (data.partyType === 'INDIVIDUAL') {
      if (!data.firstName || !data.firstName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'First name is required',
          path: ['firstName'],
        });
      }
      if (!data.lastName || !data.lastName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last name is required',
          path: ['lastName'],
        });
      }
    } else if (data.partyType === 'ORGANIZATION') {
      if (!data.businessName || !data.businessName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business name is required',
          path: ['businessName'],
        });
      }
    }

    if (!data.accountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account type is required',
        path: ['accountType'],
      });
    }
    if (!data.accountNumber || !data.accountNumber.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account number is required',
        path: ['accountNumber'],
      });
    }
    if (!data.routingNumber || !data.routingNumber.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Routing number is required',
        path: ['routingNumber'],
      });
    }

    // RTP and WIRE require address fields per schema/config
    if (data.method === 'RTP' || data.method === 'WIRE') {
      if (!data.addressLine1 || !data.addressLine1.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Address line 1 is required',
          path: ['addressLine1'],
        });
      }
      if (!data.city || !data.city.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City is required',
          path: ['city'],
        });
      }
      if (!data.state || !data.state.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'State is required',
          path: ['state'],
        });
      }
    }
  });

// Keep runtime validation via Zod, but use the shared compile-time type
// to ensure consistency across hooks and components.

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
      recipientMode: 'existing',
      to: '',
      amount: '',
      method: 'ACH',
      currency: 'USD',
      memo: '',
      partyType: 'INDIVIDUAL',
      accountType: 'CHECKING',
      countryCode: 'US',
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

  const resetForm = useCallback(() => {
    // Only reset if there are actual values to reset
    const currentValues = form.getValues();
    const hasValues = Object.values(currentValues).some(
      (value) => value !== '' && value !== undefined && value !== null
    );

    if (hasValues) {
      form.reset();
      setIsSuccess(false);
    }
  }, [form]);

  return {
    form,
    onSubmit,
    isLoading,
    isSuccess,
    resetForm,
  };
};
