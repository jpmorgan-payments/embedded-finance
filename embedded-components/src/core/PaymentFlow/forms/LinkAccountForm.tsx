'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

/**
 * Form schema for linking an account
 */
const linkAccountSchema = z.object({
  nickname: z.string().min(1, 'Account nickname is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().min(9, 'Routing number must be 9 digits').max(9),
});

type LinkAccountFormData = z.infer<typeof linkAccountSchema>;

interface LinkAccountFormProps {
  onSubmit: (data: LinkAccountFormData) => void;
  onCancel: () => void;
  onConnectWithPlaid?: () => void;
  isSubmitting?: boolean;
}

/**
 * LinkAccountForm component
 * Form for linking an external bank account (own account for transfers)
 */
export function LinkAccountForm({
  onSubmit,
  onCancel,
  onConnectWithPlaid,
  isSubmitting = false,
}: LinkAccountFormProps) {
  const form = useForm<LinkAccountFormData>({
    resolver: zodResolver(linkAccountSchema),
    defaultValues: {
      nickname: '',
      accountNumber: '',
      routingNumber: '',
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <div className="eb-space-y-6">
      <div>
        <h2 className="eb-text-lg eb-font-semibold">Link My Account</h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          Connect your account from another bank. Linked accounts use ACH
          transfers.
        </p>
      </div>

      {/* Plaid Connect Option */}
      {onConnectWithPlaid && (
        <>
          <Button
            type="button"
            variant="outline"
            className="eb-h-auto eb-w-full eb-justify-start eb-gap-3 eb-p-4"
            onClick={onConnectWithPlaid}
          >
            <div className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10">
              <Link2 className="eb-h-5 eb-w-5 eb-text-primary" />
            </div>
            <div className="eb-text-left">
              <div className="eb-font-medium">Connect with Plaid</div>
              <div className="eb-text-sm eb-text-muted-foreground">
                Securely link using your bank login
              </div>
            </div>
          </Button>

          <div className="eb-relative">
            <div className="eb-absolute eb-inset-0 eb-flex eb-items-center">
              <span className="eb-w-full eb-border-t" />
            </div>
            <div className="eb-relative eb-flex eb-justify-center eb-text-xs eb-uppercase">
              <span className="eb-bg-background eb-px-2 eb-text-muted-foreground">
                Or enter details manually
              </span>
            </div>
          </div>
        </>
      )}

      {/* Manual Entry Form */}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="eb-space-y-4">
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Nickname *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., My Chase Savings" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number *</FormLabel>
                <FormControl>
                  <Input placeholder="123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="routingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Routing Number *</FormLabel>
                <FormControl>
                  <Input placeholder="021000021" maxLength={9} {...field} />
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
              {isSubmitting ? 'Linking...' : 'Link Account'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
