'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { Payee, PaymentMethod } from '../PaymentFlow.types';

/**
 * Form schema for enabling a payment method
 */
const enablePaymentMethodSchema = z.object({
  beneficiaryAddress: z.string().min(1, 'Beneficiary address is required'),
  beneficiaryCity: z.string().min(1, 'City is required'),
  beneficiaryState: z.string().min(2, 'State is required').max(2),
  beneficiaryZip: z.string().min(5, 'ZIP code is required'),
  bankAddress: z.string().min(1, 'Bank address is required'),
  swiftBic: z.string().optional(),
});

type EnablePaymentMethodFormData = z.infer<typeof enablePaymentMethodSchema>;

interface EnablePaymentMethodFormProps {
  payee: Payee;
  paymentMethod: PaymentMethod;
  onSubmit: (data: EnablePaymentMethodFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * EnablePaymentMethodForm component
 * Form for enabling a payment method for an existing payee
 */
export function EnablePaymentMethodForm({
  payee,
  paymentMethod,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EnablePaymentMethodFormProps) {
  const form = useForm<EnablePaymentMethodFormData>({
    resolver: zodResolver(enablePaymentMethodSchema),
    defaultValues: {
      // Pre-fill from existing payee data if available
      beneficiaryAddress: payee.details?.beneficiaryAddress ?? '',
      beneficiaryCity: payee.details?.beneficiaryCity ?? '',
      beneficiaryState: payee.details?.beneficiaryState ?? '',
      beneficiaryZip: payee.details?.beneficiaryZip ?? '',
      bankAddress: payee.details?.bankAddress ?? '',
      swiftBic: payee.details?.swiftBic ?? '',
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  // Mask account number
  const maskedAccount = payee.accountNumber
    ? `••••${payee.accountNumber.slice(-4)}`
    : '••••';

  return (
    <div className="eb-space-y-6">
      <div>
        <h2 className="eb-text-lg eb-font-semibold">
          Enable {paymentMethod.name}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          Enable {paymentMethod.name.toLowerCase()} for {payee.name}
        </p>
      </div>

      {/* Payee Info Card */}
      <Card>
        <CardContent className="eb-p-4">
          <div className="eb-text-sm eb-text-muted-foreground">
            Payee Information
          </div>
          <div className="eb-mt-2 eb-space-y-1">
            <div className="eb-flex eb-justify-between">
              <span className="eb-text-muted-foreground">Name</span>
              <span className="eb-font-medium">{payee.name}</span>
            </div>
            <div className="eb-flex eb-justify-between">
              <span className="eb-text-muted-foreground">Account</span>
              <span>{maskedAccount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wire Transfer Fields */}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="eb-space-y-4">
          <div>
            <h3 className="eb-font-medium">{paymentMethod.name} Details</h3>
            <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
              Please confirm or provide the following information to enable{' '}
              {paymentMethod.name.toLowerCase()}.
            </p>
          </div>

          <FormField
            control={form.control}
            name="beneficiaryAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beneficiary Address *</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="eb-grid eb-grid-cols-3 eb-gap-3">
            <FormField
              control={form.control}
              name="beneficiaryCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beneficiaryState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beneficiaryZip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP *</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Address *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="270 Park Avenue, New York, NY"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="swiftBic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SWIFT/BIC Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="CHASUS33" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="eb-flex eb-gap-3 eb-pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="eb-flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="eb-flex-1">
              {isSubmitting ? 'Enabling...' : 'Enable & Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
