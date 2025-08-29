/**
 * SolePropStepForm Component
 * =========================
 * Form component for collecting sole proprietorship information during onboarding.
 * Combines both business and personal information in one form with smart field reuse.
 */

import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Form } from '@/components/ui/form';

import { FormActions } from '../FormActions/FormActions';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import { stateOptions } from '../utils/stateOptions';

export const SolePropStepForm: FC = () => {
  const { t } = useTranslation('onboarding-old');

  // Placeholder for form setup - will be implemented later
  const form = {} as any;

  // Placeholder for field arrays - will be implemented later
  const addressFields = { fields: [] };
  const personalAddressFields = { fields: [] };
  const idFields = { fields: [] };

  return (
    <Form {...form}>
      <form className="eb-space-y-6">
        {/* Business Information Section */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            {t('fields.solePropBusinessInfo.label')}
          </legend>

          <OnboardingFormField
            control={form.control}
            name="solePropOrganizationName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="solePropDbaName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="solePropBusinessDescription"
            type="textarea"
          />

          <OnboardingFormField
            control={form.control}
            name="solePropBusinessEmail"
            type="email"
          />

          <OnboardingFormField
            control={form.control}
            name="solePropYearStarted"
            type="text"
            inputProps={{ maxLength: 4 }}
          />

          <OnboardingFormField
            control={form.control}
            name="countryOfFormation"
            type="combobox"
            options={COUNTRIES_OF_FORMATION.map((code) => ({
              value: code,
              label: (
                <span>
                  <span className="eb-font-medium">[{code}]</span>{' '}
                  {t([
                    `common:countries.${code}`,
                  ] as unknown as TemplateStringsArray)}
                </span>
              ),
            }))}
          />

          {/* Industry Information */}
          <OnboardingFormField
            control={form.control}
            name="industryType"
            type="industrySelect"
          />

          <OnboardingFormField
            control={form.control}
            name="mcc"
            type="text"
            inputProps={{
              pattern: '[0-9]{4}',
              maxLength: 4,
              inputMode: 'numeric',
            }}
          />
        </fieldset>

        {/* Business Phone Information */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Business Phone Information
          </legend>

          <OnboardingFormField
            control={form.control}
            name="solePropBusinessInfo.usePersonalPhone"
            type="checkbox"
          />

          <OnboardingFormField
            control={form.control}
            name="organizationPhone.phoneType"
            type="select"
            options={[
              {
                value: 'BUSINESS_PHONE',
                label: t('phoneTypes.BUSINESS_PHONE'),
              },
              { value: 'MOBILE_PHONE', label: t('phoneTypes.MOBILE_PHONE') },
              {
                value: 'ALTERNATE_PHONE',
                label: t('phoneTypes.ALTERNATE_PHONE'),
              },
            ]}
          />

          <OnboardingFormField
            control={form.control}
            name="organizationPhone.phoneNumber"
            type="phone"
          />
        </fieldset>

        {/* Business Address */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Business Address
          </legend>

          <OnboardingFormField
            control={form.control}
            name="solePropBusinessInfo.usePersonalAddress"
            type="checkbox"
          />

          {addressFields.fields.map((field: any, index: number) => (
            <div key={field.id} className="eb-contents">
              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.addressType`}
                type="select"
                options={[
                  {
                    value: 'BUSINESS_ADDRESS',
                    label: t('addressTypes.BUSINESS_ADDRESS'),
                  },
                  {
                    value: 'MAILING_ADDRESS',
                    label: t('addressTypes.MAILING_ADDRESS'),
                  },
                ]}
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.addressLines.0`}
                label="Address Line 1"
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.addressLines.1`}
                label="Address Line 2"
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.city`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.state`}
                type="select"
                options={stateOptions}
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.postalCode`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.country`}
                type="combobox"
                options={COUNTRIES_OF_FORMATION.map((code) => ({
                  value: code,
                  label: (
                    <span>
                      <span className="eb-font-medium">[{code}]</span>{' '}
                      {t([
                        `common:countries.${code}`,
                      ] as unknown as TemplateStringsArray)}
                    </span>
                  ),
                }))}
              />
            </div>
          ))}
        </fieldset>

        {/* Optional Business ID (EIN) */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Business Identification (Optional)
          </legend>

          <OnboardingFormField
            control={form.control}
            name="solePropEin"
            type="text"
            maskFormat="## - #######"
            maskChar="_"
          />
        </fieldset>

        {/* Personal Information Section */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            {t('fields.solePropPersonalInfo.label')}
          </legend>

          <OnboardingFormField
            control={form.control}
            name="firstName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="middleName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="lastName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="nameSuffix"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="birthDate"
            type="date"
          />

          <OnboardingFormField
            control={form.control}
            name="individualEmail"
            type="email"
          />
        </fieldset>

        {/* Personal Phone Information */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Personal Phone Information
          </legend>

          <OnboardingFormField
            control={form.control}
            name="individualPhone.phoneType"
            type="select"
            options={[
              { value: 'MOBILE_PHONE', label: t('phoneTypes.MOBILE_PHONE') },
              {
                value: 'ALTERNATE_PHONE',
                label: t('phoneTypes.ALTERNATE_PHONE'),
              },
            ]}
          />

          <OnboardingFormField
            control={form.control}
            name="individualPhone.phoneNumber"
            type="phone"
          />
        </fieldset>

        {/* Personal Address */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Personal Address
          </legend>

          {personalAddressFields.fields.map((field: any, index: number) => (
            <div key={field.id} className="eb-contents">
              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.addressType`}
                type="select"
                options={[
                  {
                    value: 'RESIDENTIAL_ADDRESS',
                    label: t('addressTypes.RESIDENTIAL_ADDRESS'),
                  },
                  {
                    value: 'MAILING_ADDRESS',
                    label: t('addressTypes.MAILING_ADDRESS'),
                  },
                ]}
              />

              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.addressLines.0`}
                label="Address Line 1"
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.addressLines.1`}
                label="Address Line 2"
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.city`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.state`}
                type="select"
                options={stateOptions}
              />

              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.postalCode`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`individualAddresses.${index}.country`}
                type="combobox"
                options={COUNTRIES_OF_FORMATION.map((code) => ({
                  value: code,
                  label: (
                    <span>
                      <span className="eb-font-medium">[{code}]</span>{' '}
                      {t([
                        `common:countries.${code}`,
                      ] as unknown as TemplateStringsArray)}
                    </span>
                  ),
                }))}
              />
            </div>
          ))}
        </fieldset>

        {/* Personal IDs */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Personal Identification Documents
          </legend>

          {idFields.fields.map((field: any, index: number) => (
            <div key={field.id} className="eb-contents">
              <OnboardingFormField
                control={form.control}
                name={`individualIds.${index}.idType`}
                type="select"
                options={[
                  { value: 'SSN', label: 'SSN' },
                  { value: 'ITIN', label: 'ITIN' },
                ]}
              />

              <OnboardingFormField
                control={form.control}
                name={`individualIds.${index}.value`}
                type="text"
                maskFormat="### - ## - ####"
                maskChar="_"
              />

              <OnboardingFormField
                control={form.control}
                name={`individualIds.${index}.issuer`}
                type="combobox"
                options={COUNTRIES_OF_FORMATION.map((code) => ({
                  value: code,
                  label: (
                    <span>
                      <span className="eb-font-medium">[{code}]</span>{' '}
                      {t([
                        `common:countries.${code}`,
                      ] as unknown as TemplateStringsArray)}
                    </span>
                  ),
                }))}
              />
            </div>
          ))}
        </fieldset>

        <ServerErrorAlert error={null} />
        <FormActions />
      </form>
    </Form>
  );
};
