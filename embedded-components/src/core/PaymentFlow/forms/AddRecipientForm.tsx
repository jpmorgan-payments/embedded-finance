'use client';

import React from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Building2, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { DEFAULT_PAYMENT_METHODS } from '../PaymentFlow.constants';
import type { PaymentMethod, PaymentMethodType } from '../PaymentFlow.types';

/**
 * Form schema for adding a recipient
 */
const addRecipientSchema = z
  .object({
    recipientType: z.enum(['INDIVIDUAL', 'BUSINESS']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    businessName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    routingNumber: z.string().min(9, 'Routing number must be 9 digits').max(9),
    selectedPaymentMethods: z
      .array(z.enum(['ACH', 'RTP', 'WIRE', 'SAME_DAY_ACH']))
      .min(1),
    // Wire-specific fields
    beneficiaryAddress: z.string().optional(),
    beneficiaryCity: z.string().optional(),
    beneficiaryState: z.string().optional(),
    beneficiaryZip: z.string().optional(),
    bankAddress: z.string().optional(),
    swiftBic: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.recipientType === 'INDIVIDUAL') {
        return data.firstName && data.lastName;
      }
      return data.businessName;
    },
    {
      message: 'Name is required',
      path: ['firstName'],
    }
  )
  .refine(
    (data) => {
      if (data.selectedPaymentMethods.includes('WIRE')) {
        return (
          data.beneficiaryAddress &&
          data.beneficiaryCity &&
          data.beneficiaryState &&
          data.beneficiaryZip &&
          data.bankAddress
        );
      }
      return true;
    },
    {
      message: 'Wire transfer details are required',
      path: ['beneficiaryAddress'],
    }
  );

type AddRecipientFormData = z.infer<typeof addRecipientSchema>;

interface AddRecipientFormProps {
  preSelectedPaymentMethod?: PaymentMethodType;
  availablePaymentMethods?: PaymentMethod[];
  onSubmit: (data: AddRecipientFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * AddRecipientForm component
 * Form for adding a new recipient with payment method selection
 */
export function AddRecipientForm({
  preSelectedPaymentMethod,
  availablePaymentMethods = DEFAULT_PAYMENT_METHODS,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddRecipientFormProps) {
  const { t, tString } = useTranslationWithTokens(['make-payment']);

  const form = useForm<AddRecipientFormData>({
    resolver: zodResolver(addRecipientSchema),
    defaultValues: {
      recipientType: 'INDIVIDUAL',
      selectedPaymentMethods: preSelectedPaymentMethod
        ? [preSelectedPaymentMethod]
        : ['ACH'],
      firstName: '',
      lastName: '',
      businessName: '',
      email: '',
      phone: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      beneficiaryAddress: '',
      beneficiaryCity: '',
      beneficiaryState: '',
      beneficiaryZip: '',
      bankAddress: '',
      swiftBic: '',
    },
  });

  const recipientType = form.watch('recipientType');
  const selectedMethods = form.watch('selectedPaymentMethods');
  const _showWireFields = selectedMethods.includes('WIRE');

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="eb-space-y-6">
        {/* Payment Method Selection (shown at top when in flow) */}
        {preSelectedPaymentMethod && (
          <div className="eb-rounded-lg eb-border eb-bg-muted/30 eb-p-3">
            <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm">
              <span className="eb-text-muted-foreground">
                {t('addRecipient.paymentMethodLabel', 'Payment Method:')}
              </span>
              <span className="eb-font-medium">
                {
                  availablePaymentMethods.find(
                    (m) => m.id === preSelectedPaymentMethod
                  )?.name
                }
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="eb-h-auto eb-p-0 eb-text-xs"
                onClick={() => {
                  // Allow changing - would need to expose this
                }}
              >
                {t('addRecipient.changeButton', 'Change')}
              </Button>
            </div>
          </div>
        )}

        {/* Recipient Type */}
        <FormField
          control={form.control}
          name="recipientType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('addRecipient.recipientTypeLabel', 'Recipient Type')}
              </FormLabel>
              <div className="eb-flex eb-gap-3">
                <Button
                  type="button"
                  variant={field.value === 'INDIVIDUAL' ? 'default' : 'outline'}
                  className="eb-flex-1"
                  onClick={() => field.onChange('INDIVIDUAL')}
                >
                  {t('addRecipient.individual', 'Individual')}
                </Button>
                <Button
                  type="button"
                  variant={field.value === 'BUSINESS' ? 'default' : 'outline'}
                  className="eb-flex-1"
                  onClick={() => field.onChange('BUSINESS')}
                >
                  {t('addRecipient.business', 'Business')}
                </Button>
              </div>
            </FormItem>
          )}
        />

        {/* Name Fields */}
        {recipientType === 'INDIVIDUAL' ? (
          <div className="eb-grid eb-grid-cols-2 eb-gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('addRecipient.firstNameLabel', 'First Name *')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tString(
                        'addRecipient.firstNamePlaceholder',
                        'John'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('addRecipient.lastNameLabel', 'Last Name *')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tString(
                        'addRecipient.lastNamePlaceholder',
                        'Doe'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('addRecipient.businessNameLabel', 'Business Name *')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={tString(
                      'addRecipient.businessNamePlaceholder',
                      'Acme Corp'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Bank Account Details */}
        <div className="eb-space-y-4">
          <h3 className="eb-font-medium">
            {t('addRecipient.bankAccountSection', 'Bank Account')}
          </h3>

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('addRecipient.bankNameLabel', 'Bank Name *')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={tString(
                      'addRecipient.bankNamePlaceholder',
                      'Chase Bank'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="eb-grid eb-grid-cols-2 eb-gap-4">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('addRecipient.accountNumberLabel', 'Account Number *')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tString(
                        'addRecipient.accountNumberPlaceholder',
                        '123456789'
                      )}
                      {...field}
                    />
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
                  <FormLabel>
                    {t('addRecipient.routingNumberLabel', 'Routing Number *')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tString(
                        'addRecipient.routingNumberPlaceholder',
                        '021000021'
                      )}
                      maxLength={9}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Payment Methods Selection */}
        {!preSelectedPaymentMethod && (
          <div className="eb-space-y-4">
            <div>
              <h3 className="eb-font-medium">
                {t(
                  'addRecipient.enablePaymentMethodsTitle',
                  'Enable Payment Methods'
                )}
              </h3>
              <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                {t(
                  'addRecipient.enablePaymentMethodsDescription',
                  'Select which payment methods to enable. You can enable more methods later.'
                )}
              </p>
            </div>

            <FormField
              control={form.control}
              name="selectedPaymentMethods"
              render={({ field }) => (
                <FormItem>
                  <div className="eb-space-y-3">
                    {availablePaymentMethods.map((method) => {
                      const isSelected = field.value.includes(method.id);
                      const isACH = method.id === 'ACH';
                      const Icon =
                        method.id === 'WIRE'
                          ? Building2
                          : method.id === 'RTP'
                            ? Zap
                            : Banknote;

                      return (
                        <div
                          key={method.id}
                          className={cn(
                            'eb-rounded-lg eb-border eb-p-4',
                            isSelected
                              ? 'eb-border-primary eb-bg-primary/5'
                              : 'eb-border-border'
                          )}
                        >
                          <div className="eb-flex eb-items-start eb-gap-3">
                            <Checkbox
                              checked={isSelected}
                              disabled={isACH} // ACH is always included
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, method.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((m) => m !== method.id)
                                  );
                                }
                              }}
                            />
                            <div className="eb-flex-1">
                              <div className="eb-flex eb-items-center eb-gap-2">
                                <Icon className="eb-h-4 eb-w-4" />
                                <span className="eb-font-medium">
                                  {method.name}
                                </span>
                                {isACH && (
                                  <span className="eb-text-xs eb-text-muted-foreground">
                                    {t(
                                      'addRecipient.alwaysIncluded',
                                      '(always included)'
                                    )}
                                  </span>
                                )}
                              </div>
                              {method.fee !== undefined && method.fee > 0 && (
                                <div className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                                  {t('addRecipient.feeLabel', '{{fee}} fee', {
                                    fee: `$${method.fee}`,
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Wire Transfer Fields */}
                          {method.id === 'WIRE' && isSelected && (
                            <div className="eb-mt-4 eb-space-y-4 eb-border-t eb-pt-4">
                              <FormField
                                control={form.control}
                                name="beneficiaryAddress"
                                render={({ field: addressField }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t(
                                        'addRecipient.beneficiaryAddressLabel',
                                        'Beneficiary Address *'
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={tString(
                                          'addRecipient.addressPlaceholder',
                                          '123 Main St'
                                        )}
                                        {...addressField}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="eb-grid eb-grid-cols-3 eb-gap-3">
                                <FormField
                                  control={form.control}
                                  name="beneficiaryCity"
                                  render={({ field: cityField }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t('addRecipient.cityLabel', 'City *')}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={tString(
                                            'addRecipient.cityPlaceholder',
                                            'New York'
                                          )}
                                          {...cityField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="beneficiaryState"
                                  render={({ field: stateField }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t(
                                          'addRecipient.stateLabel',
                                          'State *'
                                        )}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={tString(
                                            'addRecipient.statePlaceholder',
                                            'NY'
                                          )}
                                          maxLength={2}
                                          {...stateField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="beneficiaryZip"
                                  render={({ field: zipField }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t('addRecipient.zipLabel', 'ZIP *')}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={tString(
                                            'addRecipient.zipPlaceholder',
                                            '10001'
                                          )}
                                          {...zipField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="bankAddress"
                                render={({ field: bankAddrField }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t(
                                        'addRecipient.bankAddressLabel',
                                        'Bank Address *'
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={tString(
                                          'addRecipient.bankAddressPlaceholder',
                                          '270 Park Avenue, New York, NY'
                                        )}
                                        {...bankAddrField}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="swiftBic"
                                render={({ field: swiftField }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t(
                                        'addRecipient.swiftBicLabel',
                                        'SWIFT/BIC Code (Optional)'
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={tString(
                                          'addRecipient.swiftBicPlaceholder',
                                          'CHASUS33'
                                        )}
                                        {...swiftField}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Wire Fields (when pre-selected) */}
        {preSelectedPaymentMethod === 'WIRE' && (
          <div className="eb-space-y-4">
            <h3 className="eb-font-medium">
              {t('addRecipient.wireTransferDetails', 'Wire Transfer Details')}
            </h3>

            <FormField
              control={form.control}
              name="beneficiaryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      'addRecipient.beneficiaryAddressLabel',
                      'Beneficiary Address *'
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tString(
                        'addRecipient.addressPlaceholder',
                        '123 Main St'
                      )}
                      {...field}
                    />
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
                    <FormLabel>
                      {t('addRecipient.cityLabel', 'City *')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tString(
                          'addRecipient.cityPlaceholder',
                          'New York'
                        )}
                        {...field}
                      />
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
                    <FormLabel>
                      {t('addRecipient.stateLabel', 'State *')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tString(
                          'addRecipient.statePlaceholder',
                          'NY'
                        )}
                        maxLength={2}
                        {...field}
                      />
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
                    <FormLabel>{t('addRecipient.zipLabel', 'ZIP *')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tString(
                          'addRecipient.zipPlaceholder',
                          '10001'
                        )}
                        {...field}
                      />
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
                  <FormLabel>
                    {t('addRecipient.bankAddressLabel', 'Bank Address *')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tString(
                        'addRecipient.bankAddressPlaceholder',
                        '270 Park Avenue, New York, NY'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Actions */}
        <div className="eb-flex eb-gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="eb-flex-1"
          >
            {t('addRecipient.cancelButton', 'Cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="eb-flex-1">
            {isSubmitting
              ? t('addRecipient.savingButton', 'Saving...')
              : t('addRecipient.saveButton', 'Save & Continue')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
