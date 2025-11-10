import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { PaymentFormData } from '../../types';

export const ManualRecipientFields: React.FC = () => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();
  const partyType = form.watch('partyType') || 'INDIVIDUAL';
  const method = form.watch('method');

  return (
    <div className="eb-space-y-4">
      {/* Party Type */}
      <FormField
        control={form.control}
        name="partyType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('fields.partyType.label', { defaultValue: 'Recipient type' })}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('fields.partyType.placeholder', {
                      defaultValue: 'Select type',
                    })}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="ORGANIZATION">Organization</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Names or Business name */}
      {partyType === 'INDIVIDUAL' ? (
        <div className="eb-grid eb-grid-cols-1 eb-gap-4 sm:eb-grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.firstName.label', { defaultValue: 'First name' })}
                </FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  {t('fields.lastName.label', { defaultValue: 'Last name' })}
                </FormLabel>
                <FormControl>
                  <Input {...field} />
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
                {t('fields.businessName.label', {
                  defaultValue: 'Business name',
                })}
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Account Info */}
      <div className="eb-grid eb-grid-cols-1 eb-gap-4 sm:eb-grid-cols-2">
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('fields.accountType.label', {
                  defaultValue: 'Account type',
                })}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('fields.accountType.placeholder', {
                        defaultValue: 'Select type',
                      })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                  <SelectItem value="IBAN">IBAN</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('fields.accountNumber.label', {
                  defaultValue: 'Account number',
                })}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={
                    t('fields.accountNumber.placeholder', {
                      defaultValue: 'Enter account number',
                    }) as string
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Routing Number for chosen method */}
      <FormField
        control={form.control}
        name="routingNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('fields.routingNumber.label', {
                defaultValue: `${method || 'ACH'} routing number`,
              })}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={
                  t('fields.routingNumber.placeholder', {
                    defaultValue: '9-digit ABA routing number',
                  }) as string
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address requirements for RTP and WIRE */}
      {(method === 'RTP' || method === 'WIRE') && (
        <div className="eb-grid eb-grid-cols-1 eb-gap-4 sm:eb-grid-cols-2">
          <FormField
            control={form.control}
            name="addressLine1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.addressLine1.label', {
                    defaultValue: 'Address line 1',
                  })}
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123 Main St" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.city.label', { defaultValue: 'City' })}
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="New York" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.state.label', { defaultValue: 'State' })}
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="NY" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.postalCode.label', {
                    defaultValue: 'Postal code',
                  })}
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="10001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};
