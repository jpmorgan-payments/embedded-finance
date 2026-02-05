import { FC, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowRightLeftIcon,
  BanknoteIcon,
  BuildingIcon,
  InfoIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  ZapIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  RecipientContactContactType,
  RoutingInformationTransactionType,
} from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StandardFormField } from '@/components/StandardFormField';
import { Separator } from '@/components/ui';

import { useBankAccountFormSchema } from './BankAccountForm.schema';
import type {
  BankAccountFormData,
  BankAccountFormProps,
} from './BankAccountForm.types';

/**
 * PaymentMethodSelector - Compact checkbox selector for payment methods
 */
interface PaymentMethodSelectorProps {
  selectedTypes: RoutingInformationTransactionType[];
  onChange: (types: RoutingInformationTransactionType[]) => void;
  availableTypes: RoutingInformationTransactionType[];
  configs: BankAccountFormProps['config']['paymentMethods']['configs'];
  allowMultiple: boolean;
}

const PaymentMethodSelector: FC<PaymentMethodSelectorProps> = ({
  selectedTypes = [],
  onChange,
  availableTypes,
  configs,
  allowMultiple,
}) => {
  const { t } = useTranslation('bank-account-form');
  const handleToggle = (type: RoutingInformationTransactionType) => {
    const config = configs[type];

    // Don't allow deselecting locked payment methods
    if (config?.locked && selectedTypes.includes(type)) {
      return;
    }

    let newTypes: RoutingInformationTransactionType[];

    if (allowMultiple) {
      if (selectedTypes.includes(type)) {
        // Don't allow removing if locked
        if (config?.locked) {
          return;
        }
        newTypes = selectedTypes.filter((item) => item !== type);
      } else {
        newTypes = [...selectedTypes, type];
      }
    } else {
      // Single selection mode
      newTypes = [type];
    }

    onChange(newTypes);
  };

  // Get icon for payment method type
  const getPaymentIcon = (type: RoutingInformationTransactionType) => {
    switch (type) {
      case 'ACH':
        return <BanknoteIcon className="eb-h-4 eb-w-4" />;
      case 'WIRE':
        return <ArrowRightLeftIcon className="eb-h-4 eb-w-4" />;
      case 'RTP':
        return <ZapIcon className="eb-h-4 eb-w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="eb-space-y-3">
      {availableTypes.map((type) => {
        const config = configs[type];
        const isSelected = selectedTypes.includes(type);
        const isLocked = config?.locked;

        return (
          <div key={type} className="eb-flex eb-items-center eb-gap-2">
            <label
              className={`eb-flex eb-flex-1 eb-items-start eb-gap-3 eb-rounded-lg eb-border eb-bg-card eb-p-4 eb-transition-all ${
                isSelected
                  ? 'eb-border-primary eb-bg-primary/5 eb-shadow-sm'
                  : 'eb-border-border hover:eb-border-primary/50 hover:eb-bg-accent/50'
              } ${isLocked ? 'eb-cursor-not-allowed' : 'eb-cursor-pointer'}`}
            >
              <Checkbox
                id={`payment-${type}`}
                checked={isSelected}
                disabled={isLocked}
                onCheckedChange={(checked) => {
                  if (checked !== isSelected && !isLocked) {
                    handleToggle(type);
                  }
                }}
                className="eb-mt-0.5"
              />
              <div className="eb-mt-0.5 eb-flex eb-items-center eb-gap-2 eb-text-primary">
                {getPaymentIcon(type)}
              </div>
              <div className="eb-flex eb-min-w-0 eb-flex-1 eb-flex-col eb-gap-1 sm:eb-flex-row sm:eb-flex-wrap sm:eb-items-center sm:eb-justify-between sm:eb-gap-2">
                <span className="eb-font-medium">{config.label}</span>
                {isLocked && (
                  <span className="eb-inline-flex eb-items-center eb-gap-1 eb-self-start eb-rounded-full eb-bg-informative-accent eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-informative sm:eb-px-2.5 sm:eb-py-1">
                    <LockIcon className="eb-h-3 eb-w-3 eb-shrink-0" />
                    <span className="eb-whitespace-nowrap">
                      {t('paymentMethods.requiredForLinkedAccount')}
                    </span>
                  </span>
                )}
              </div>
            </label>
            {config.description && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="eb-h-8 eb-w-8 eb-shrink-0 eb-text-muted-foreground hover:eb-text-foreground"
                    aria-label={t('paymentMethods.infoButtonAriaLabel', {
                      method: config.label,
                    })}
                  >
                    <InfoIcon className="eb-h-4 eb-w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" align="center" className="eb-w-80">
                  <div className="eb-space-y-2">
                    <h4 className="eb-text-sm eb-font-semibold">
                      {config.label}
                    </h4>
                    <p className="eb-text-sm eb-text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Helper function to get the payment methods that require a specific field
 */
const getRequiredPaymentMethods = (
  fieldType: 'address' | 'email' | 'phone',
  paymentTypes: RoutingInformationTransactionType[],
  configs: BankAccountFormProps['config']['paymentMethods']['configs']
): string[] => {
  const methods: string[] = [];

  paymentTypes.forEach((type) => {
    const methodConfig = configs[type];
    if (!methodConfig?.enabled) return;

    if (fieldType === 'address' && methodConfig.requiredFields.address) {
      methods.push(methodConfig.shortLabel);
    } else if (
      fieldType === 'email' &&
      methodConfig.requiredFields.contacts?.includes('EMAIL')
    ) {
      methods.push(methodConfig.shortLabel);
    } else if (
      fieldType === 'phone' &&
      methodConfig.requiredFields.contacts?.includes('PHONE')
    ) {
      methods.push(methodConfig.shortLabel);
    }
  });

  return methods;
};

/**
 * Hook to format "Required for X" message with proper grammar using translations
 */
const useFormatRequiredMessage = () => {
  const { t } = useTranslation('bank-account-form');

  return (methods: string[]): string | null => {
    if (methods.length === 0) return null;
    if (methods.length === 1) {
      return t('requiredFor.single', { method: methods[0] });
    }
    if (methods.length === 2) {
      return t('requiredFor.double', { first: methods[0], second: methods[1] });
    }
    return t('requiredFor.multiple', {
      list: methods.slice(0, -1).join(', '),
      last: methods[methods.length - 1],
    });
  };
};

/**
 * Helper function to format role names for display
 */
const formatRole = (role: string): string => {
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * IndividualReadonlyField - Display a single individual in readonly mode
 */
interface IndividualReadonlyFieldProps {
  individual: {
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

const IndividualReadonlyField: FC<IndividualReadonlyFieldProps> = ({
  individual,
}) => {
  const { t } = useTranslation('bank-account-form');
  return (
    <FormItem>
      <FormLabel>{t('individualSelector.accountHolder')}</FormLabel>
      <div className="eb-rounded-md eb-border eb-bg-muted eb-p-3 eb-text-sm">
        <div className="eb-flex eb-flex-col eb-gap-1">
          <span className="eb-font-medium">
            {individual.firstName} {individual.lastName}
          </span>
          {individual.roles.length > 0 && (
            <span className="eb-text-xs">
              {individual.roles.map(formatRole).join(', ')}
            </span>
          )}
        </div>
      </div>
    </FormItem>
  );
};

/**
 * IndividualSelector - Dropdown selector for multiple individuals
 */
interface IndividualSelectorProps {
  control: any;
  individuals: Array<{
    id: string | undefined;
    firstName: string;
    lastName: string;
    roles: string[];
  }>;
  selectedFirstName: string | undefined;
  selectedLastName: string | undefined;
  onSelect: (individual: { firstName: string; lastName: string }) => void;
}

const IndividualSelector: FC<IndividualSelectorProps> = ({
  control,
  individuals,
  selectedFirstName,
  selectedLastName,
  onSelect,
}) => {
  const { t } = useTranslation('bank-account-form');
  const selectedIndividual = individuals.find(
    (party) =>
      party.firstName === selectedFirstName &&
      party.lastName === selectedLastName
  );

  return (
    <FormField
      control={control}
      name="firstName"
      render={() => (
        <FormItem>
          <FormLabel>{t('individualSelector.accountHolder')}</FormLabel>
          <Select
            value={selectedIndividual?.id || ''}
            onValueChange={(partyId) => {
              const individual = individuals.find((p) => p.id === partyId);
              if (individual) {
                onSelect(individual);
              }
            }}
          >
            <FormControl>
              <SelectTrigger className="eb-h-auto eb-min-h-[48px]">
                <SelectValue
                  placeholder={t('individualSelector.placeholder')}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {individuals.map((party) => (
                <SelectItem key={party.id} value={party.id || ''}>
                  <div className="eb-flex eb-flex-col eb-items-start eb-gap-1 eb-py-1">
                    <span className="eb-font-medium">
                      {party.firstName} {party.lastName}
                    </span>
                    {party.roles.length > 0 && (
                      <span className="eb-text-xs">
                        {party.roles.map(formatRole).join(', ')}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

/**
 * RoutingNumberFields - Dynamic routing number input fields per payment method
 */
interface RoutingNumberFieldsProps {
  paymentMethods: RoutingInformationTransactionType[];
  useSameForAll: boolean;
  onUseSameForAllChange: (value: boolean) => void;
  configs: BankAccountFormProps['config']['paymentMethods']['configs'];
  control: any; // React Hook Form control
  disabled?: boolean;
}

const RoutingNumberFields: FC<RoutingNumberFieldsProps> = ({
  paymentMethods,
  useSameForAll,
  onUseSameForAllChange,
  configs,
  control,
  disabled = false,
}) => {
  const { t } = useTranslation('bank-account-form');
  // Only show checkbox if there are multiple payment methods
  const showCheckbox = paymentMethods.length > 1;

  // Single payment method - no fieldset, just show the field with payment method in label
  if (!showCheckbox) {
    const singleMethod = paymentMethods[0];
    const config = configs[singleMethod];

    return (
      <FormField
        control={control}
        name="routingNumbers.0.routingNumber"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              {t('routingNumbers.singleMethodLabel', {
                method: config.shortLabel,
              })}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="text"
                placeholder={t('routingNumbers.placeholder')}
                maxLength={9}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    );
  }

  // Multiple payment methods - wrap in fieldset
  return (
    <fieldset className="eb-space-y-3 eb-rounded-lg eb-border eb-p-4 eb-pt-1">
      <legend className="eb-px-2 eb-text-sm eb-font-semibold">
        {t('routingNumbers.legend')}
      </legend>

      {/* Checkbox for using same routing number */}
      <label
        htmlFor="useSameRoutingNumber"
        className="eb-flex eb-cursor-pointer eb-items-center eb-gap-2 eb-pb-2"
      >
        <Checkbox
          id="useSameRoutingNumber"
          checked={useSameForAll}
          onCheckedChange={onUseSameForAllChange}
          disabled={disabled}
        />
        <span className="eb-text-sm eb-font-medium eb-leading-none">
          {t('routingNumbers.useSameForAll')}
        </span>
      </label>

      {/* Routing number fields */}
      {useSameForAll ? (
        // Single field when using same for all
        <FormField
          control={control}
          name="routingNumbers.0.routingNumber"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                {t('routingNumbers.combinedMethodLabel', {
                  methods: paymentMethods
                    .map((method) => configs[method].shortLabel)
                    .join(' / '),
                })}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder={t('routingNumbers.placeholder')}
                  maxLength={9}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      ) : (
        // Individual fields for each payment method
        <div className="eb-space-y-3">
          {paymentMethods.map((method, index) => {
            const config = configs[method];
            return (
              <FormField
                key={method}
                control={control}
                name={`routingNumbers.${index}.routingNumber`}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      {t('routingNumbers.singleMethodLabel', {
                        method: config.shortLabel,
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder={t('routingNumbers.placeholder')}
                        maxLength={9}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      )}
    </fieldset>
  );
};

/**
 * ContactFields - Dynamic contact input fields
 */
interface ContactFieldsProps {
  value: BankAccountFormData['contacts'];
  onChange: (contacts: BankAccountFormData['contacts']) => void;
  requiredTypes: Set<RecipientContactContactType>;
  paymentTypes: RoutingInformationTransactionType[];
  configs: BankAccountFormProps['config']['paymentMethods']['configs'];
  disabled?: boolean;
}

const ContactFields: FC<ContactFieldsProps> = ({
  value = [],
  onChange,
  requiredTypes,
  paymentTypes,
  configs,
  disabled = false,
}) => {
  const { t } = useTranslation('bank-account-form');
  const handleContactChange = (
    type: RecipientContactContactType,
    contactValue: string,
    countryCode?: string
  ) => {
    const existingIndex = value.findIndex((c) => c.contactType === type);
    const newContacts = [...value];

    if (existingIndex >= 0) {
      if (contactValue.trim()) {
        newContacts[existingIndex] = {
          contactType: type,
          value: contactValue,
          countryCode,
        };
      } else {
        newContacts.splice(existingIndex, 1);
      }
    } else if (contactValue.trim()) {
      newContacts.push({
        contactType: type,
        value: contactValue,
        countryCode,
      });
    }

    onChange(newContacts);
  };

  const getContactValue = (type: RecipientContactContactType) => {
    return value.find((c) => c.contactType === type)?.value || '';
  };

  // Only show fields that are required
  const showEmail = requiredTypes.has('EMAIL');
  const showPhone = requiredTypes.has('PHONE');

  // If no contact fields are required, don't render anything
  if (!showEmail && !showPhone) {
    return null;
  }

  // Get conditional requirement reasons
  const formatRequiredMessage = useFormatRequiredMessage();
  const emailMethods = showEmail
    ? getRequiredPaymentMethods('email', paymentTypes, configs)
    : [];
  const phoneMethods = showPhone
    ? getRequiredPaymentMethods('phone', paymentTypes, configs)
    : [];
  const emailReason = formatRequiredMessage(emailMethods);
  const phoneReason = formatRequiredMessage(phoneMethods);

  return (
    <div className="eb-space-y-4">
      <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
        {showEmail && (
          <FormItem>
            <FormLabel>
              <span className="eb-flex eb-items-center eb-gap-2">
                <MailIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                {t('contacts.email.label')}
                {emailReason && (
                  <span className="eb-ml-auto eb-inline-flex eb-items-center eb-gap-1 eb-rounded-full eb-bg-informative-accent eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-informative">
                    <InfoIcon className="eb-h-3 eb-w-3" />
                    {emailReason}
                  </span>
                )}
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                value={getContactValue('EMAIL')}
                onChange={(e) => handleContactChange('EMAIL', e.target.value)}
                placeholder={t('contacts.email.placeholder')}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}

        {showPhone && (
          <FormItem>
            <FormLabel>
              <span className="eb-flex eb-items-center eb-gap-2">
                <PhoneIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                {t('contacts.phone.label')}
                {phoneReason && (
                  <span className="eb-ml-auto eb-inline-flex eb-items-center eb-gap-1 eb-rounded-full eb-bg-informative-accent eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-informative">
                    <InfoIcon className="eb-h-3 eb-w-3" />
                    {phoneReason}
                  </span>
                )}
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="tel"
                value={getContactValue('PHONE')}
                onChange={(e) => handleContactChange('PHONE', e.target.value)}
                placeholder={t('contacts.phone.placeholder')}
                disabled={disabled}
              />
            </FormControl>
            {phoneReason && (
              <FormDescription className="eb-text-xs eb-italic eb-text-muted-foreground">
                {phoneReason}
              </FormDescription>
            )}
          </FormItem>
        )}
      </div>
    </div>
  );
};

/**
 * BankAccountForm - Core form component (2-step wizard)
 */
export const BankAccountForm: FC<BankAccountFormProps> = ({
  config,
  recipient,
  onSubmit,
  onCancel,
  isLoading = false,
  alert,
  client,
  skipStepOne = false,
  embedded = false,
  initialPaymentTypes: initialPaymentTypesProp,
}) => {
  const { t } = useTranslation('bank-account-form');
  const formatRequiredMessage = useFormatRequiredMessage();
  // Start on step 2 if skipStepOne is true
  const [currentStep, setCurrentStep] = useState<1 | 2>(skipStepOne ? 2 : 1);

  // Extract organization name from client data if available
  const organizationName = useMemo(() => {
    if (!client?.parties) return undefined;

    const orgParty = client.parties.find(
      (party) =>
        party.active &&
        party.partyType === 'ORGANIZATION' &&
        party.roles?.includes('CLIENT')
    );

    return orgParty?.organizationDetails?.organizationName;
  }, [client]);

  // Helper to sanitize string values from API (handles null, undefined)
  const sanitizeString = (
    value: string | null | undefined,
    defaultValue = ''
  ): string => {
    if (value === null || value === undefined) return defaultValue;
    return value;
  };

  // Extract individual parties from client data for linked account individual selector
  const individualParties = useMemo(() => {
    if (!client?.parties) return [];

    return client.parties
      .filter(
        (party) =>
          party.active &&
          party.partyType === 'INDIVIDUAL' &&
          party.individualDetails?.firstName &&
          party.individualDetails?.lastName
      )
      .map((party) => ({
        id: party.id,
        firstName: party.individualDetails!.firstName!,
        lastName: party.individualDetails!.lastName!,
        roles: party.roles || [],
      }));
  }, [client]);

  // Modify config if organization name is available from client data
  const effectiveConfig = useMemo(() => {
    // Only apply readonly logic when prefillFromClient is enabled and creating (no recipient yet)
    if (
      !config.accountHolder.prefillFromClient ||
      recipient?.partyDetails?.businessName ||
      recipient?.partyDetails?.firstName
    ) {
      return config;
    }

    const modifications: typeof config.readonlyFields = {};

    // If organization name exists, make business name readonly
    if (organizationName) {
      modifications.businessName = true;
    }

    // If individual parties exist, make first name and last name readonly
    if (individualParties.length > 0) {
      modifications.firstName = true;
      modifications.lastName = true;
    }

    // Only return modified config if there are modifications
    if (Object.keys(modifications).length === 0) {
      return config;
    }

    return {
      ...config,
      readonlyFields: {
        ...config.readonlyFields,
        ...modifications,
      },
    };
  }, [config, organizationName, individualParties, recipient]);

  // Create dynamic schema based on effective config
  const createSchema = useBankAccountFormSchema();
  const formSchema = useMemo(
    () => createSchema(effectiveConfig),
    [createSchema, effectiveConfig]
  );

  // Extract payment types and routing numbers from recipient if editing
  const initialPaymentTypes = useMemo(() => {
    // If explicitly provided via prop, use that (e.g., when enabling new payment method)
    if (initialPaymentTypesProp && initialPaymentTypesProp.length > 0) {
      return initialPaymentTypesProp;
    }
    // Otherwise, extract from existing recipient
    if (recipient?.account?.routingInformation) {
      return recipient.account.routingInformation
        .map((ri) => ri.transactionType)
        .filter(
          (type): type is RoutingInformationTransactionType =>
            type !== undefined && ['ACH', 'WIRE', 'RTP'].includes(type)
        );
    }
    return effectiveConfig.paymentMethods.defaultSelected || [];
  }, [
    initialPaymentTypesProp,
    recipient,
    effectiveConfig.paymentMethods.defaultSelected,
  ]);

  const initialRoutingNumbers = useMemo(() => {
    // Get existing routing numbers from recipient
    const existingRoutingNumbers: Array<{
      paymentType: RoutingInformationTransactionType;
      routingNumber: string;
    }> = [];

    if (recipient?.account?.routingInformation) {
      recipient.account.routingInformation
        .filter((ri) => ri.transactionType && ri.routingNumber)
        .forEach((ri) => {
          existingRoutingNumbers.push({
            paymentType:
              ri.transactionType as RoutingInformationTransactionType,
            routingNumber: ri.routingNumber as string,
          });
        });
    }

    // Also add empty entries for any payment methods in initialPaymentTypes that aren't in existing
    // This handles the "enable new payment method" case
    initialPaymentTypes.forEach((paymentType) => {
      if (
        !existingRoutingNumbers.find((rn) => rn.paymentType === paymentType)
      ) {
        existingRoutingNumbers.push({
          paymentType,
          routingNumber: '',
        });
      }
    });

    return existingRoutingNumbers;
  }, [recipient, initialPaymentTypes]);

  // Extract contacts from recipient with proper validation
  const initialContacts = useMemo(() => {
    if (
      !recipient?.partyDetails?.contacts ||
      !Array.isArray(recipient.partyDetails.contacts)
    ) {
      return [];
    }

    // Filter and validate contacts to ensure proper structure
    return recipient.partyDetails.contacts
      .filter((contact) => {
        // Ensure contact has required properties
        return (
          contact &&
          typeof contact === 'object' &&
          contact.contactType &&
          contact.value &&
          typeof contact.value === 'string' &&
          contact.value.trim() !== '' &&
          ['EMAIL', 'PHONE', 'WEBSITE'].includes(contact.contactType)
        );
      })
      .map((contact) => ({
        contactType: contact.contactType as RecipientContactContactType,
        value: contact.value,
        // Only include countryCode for PHONE contacts
        ...(contact.contactType === 'PHONE' && contact.countryCode
          ? { countryCode: contact.countryCode }
          : {}),
      }));
  }, [recipient]);

  const form = useForm<BankAccountFormData>({
    mode: 'onBlur',
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType:
        recipient?.partyDetails?.type ||
        effectiveConfig.accountHolder.defaultType ||
        undefined,
      firstName:
        recipient?.partyDetails?.firstName ||
        // Only pre-fill from client data if config allows it
        (effectiveConfig.accountHolder.prefillFromClient &&
        individualParties.length === 1
          ? individualParties[0].firstName
          : ''),
      lastName:
        recipient?.partyDetails?.lastName ||
        // Only pre-fill from client data if config allows it
        (effectiveConfig.accountHolder.prefillFromClient &&
        individualParties.length === 1
          ? individualParties[0].lastName
          : ''),
      businessName:
        recipient?.partyDetails?.businessName ||
        // Only pre-fill from client data if config allows it
        (effectiveConfig.accountHolder.prefillFromClient
          ? organizationName
          : '') ||
        '',
      routingNumbers: initialRoutingNumbers,
      useSameRoutingNumber: (() => {
        // Calculate if all routing numbers are the same
        if (initialRoutingNumbers.length <= 1) return true;
        const firstRouting = initialRoutingNumbers[0]?.routingNumber;
        return initialRoutingNumbers.every(
          (rn) => rn.routingNumber === firstRouting
        );
      })(),
      accountNumber: recipient?.account?.number || '',
      bankAccountType: (recipient?.account?.type as any) || 'CHECKING',
      paymentTypes: initialPaymentTypes,
      address: recipient?.partyDetails?.address
        ? {
            addressLine1: sanitizeString(
              recipient.partyDetails.address.addressLine1
            ),
            addressLine2: sanitizeString(
              recipient.partyDetails.address.addressLine2
            ),
            addressLine3: sanitizeString(
              recipient.partyDetails.address.addressLine3
            ),
            city: sanitizeString(recipient.partyDetails.address.city),
            state: sanitizeString(recipient.partyDetails.address.state),
            postalCode: sanitizeString(
              recipient.partyDetails.address.postalCode
            ),
            countryCode: (sanitizeString(
              recipient.partyDetails.address.countryCode,
              'US'
            ) || 'US') as 'US',
          }
        : undefined,
      contacts: initialContacts,
      certify: false,
    },
  });

  // Watch form values
  const accountType = form.watch('accountType');
  const paymentTypes = form.watch('paymentTypes');
  const useSameRoutingNumber = form.watch('useSameRoutingNumber');
  const firstRoutingNumber = form.watch('routingNumbers.0.routingNumber');

  // Clear routing number errors when toggling "use same" checkbox
  useEffect(() => {
    // Clear errors when switching between single/multiple routing number modes
    form.clearErrors('routingNumbers');
  }, [useSameRoutingNumber, form]);

  // Sync all routing numbers when "use same" is checked and first routing number changes
  useEffect(() => {
    if (useSameRoutingNumber && paymentTypes.length > 1 && firstRoutingNumber) {
      const currentRoutingNumbers = form.getValues('routingNumbers') || [];

      // Check if any routing numbers are different from the first one
      const needsSync = currentRoutingNumbers.some(
        (rn, index) => index > 0 && rn.routingNumber !== firstRoutingNumber
      );

      if (needsSync) {
        const updatedRoutingNumbers = paymentTypes.map((method) => ({
          paymentType: method,
          routingNumber: firstRoutingNumber,
        }));
        form.setValue('routingNumbers', updatedRoutingNumbers, {
          shouldValidate: false,
        });
      }
    }
  }, [useSameRoutingNumber, firstRoutingNumber, paymentTypes, form]);

  // When payment types change, clean up routing numbers for removed methods
  // and update useSameRoutingNumber checkbox if needed
  useEffect(() => {
    const currentRoutingNumbers = form.getValues('routingNumbers') || [];

    // Remove routing numbers for deselected payment methods
    const validRoutingNumbers = currentRoutingNumbers.filter((rn) =>
      paymentTypes.includes(rn.paymentType)
    );

    // Add empty routing numbers for newly selected payment methods
    const updatedRoutingNumbers = [...validRoutingNumbers];
    let hasNewPaymentMethod = false;

    paymentTypes.forEach((paymentType) => {
      if (!updatedRoutingNumbers.find((rn) => rn.paymentType === paymentType)) {
        // New payment method - add with empty routing number
        updatedRoutingNumbers.push({ paymentType, routingNumber: '' });
        hasNewPaymentMethod = true;
      }
    });

    // Only update if there were changes
    if (
      JSON.stringify(updatedRoutingNumbers) !==
      JSON.stringify(currentRoutingNumbers)
    ) {
      form.setValue('routingNumbers', updatedRoutingNumbers);
    }

    // Update useSameRoutingNumber checkbox based on current routing numbers
    if (paymentTypes.length <= 1) {
      // If only one payment method, always set to true
      form.setValue('useSameRoutingNumber', true);
    } else if (hasNewPaymentMethod) {
      // If a new payment method was added, uncheck if any existing routing numbers have values
      // (because the new method will have empty routing number, creating inconsistency)
      const hasExistingValues = updatedRoutingNumbers.some(
        (rn) => rn.routingNumber && rn.routingNumber.trim() !== ''
      );

      if (hasExistingValues) {
        // Uncheck because we now have a mix of filled and empty routing numbers
        form.setValue('useSameRoutingNumber', false);
      }
      // If no existing values, keep checkbox in current state (checked by default)
    } else {
      // No new payment methods - auto-update based on existing routing numbers
      const routingNumbersWithValues = updatedRoutingNumbers.filter(
        (rn) => rn.routingNumber
      );

      if (routingNumbersWithValues.length > 1) {
        const firstRouting = routingNumbersWithValues[0]?.routingNumber;
        const allSame = routingNumbersWithValues.every(
          (rn) => rn.routingNumber === firstRouting
        );
        form.setValue('useSameRoutingNumber', allSame);
      }
    }
  }, [paymentTypes, form]);

  // Determine required fields based on selected payment methods
  const showAddressFields = useMemo(() => {
    if (effectiveConfig.requiredFields.address) return true;
    return paymentTypes.some((type) => {
      const methodConfig = effectiveConfig.paymentMethods.configs[type];
      return methodConfig?.enabled && methodConfig.requiredFields.address;
    });
  }, [
    paymentTypes,
    effectiveConfig.requiredFields.address,
    effectiveConfig.paymentMethods.configs,
  ]);

  // Check if recipient's state value is a valid 2-letter US state code
  // If not, we'll show a text field instead of a dropdown
  const US_STATE_CODES = [
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
    'DC',
    'PR',
    'VI',
    'GU',
    'AS',
    'MP',
  ];
  const useStateTextField = useMemo(() => {
    const recipientState = recipient?.partyDetails?.address?.state;
    // If no recipient or no state, use dropdown (default)
    if (!recipientState) return false;
    // If state is not a valid 2-letter code, use text field
    return !US_STATE_CODES.includes(recipientState.toUpperCase());
  }, [recipient?.partyDetails?.address?.state]);

  // Initialize address object when address fields become required
  useEffect(() => {
    const currentAddress = form.getValues('address');
    if (showAddressFields && !currentAddress) {
      form.setValue('address', {
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        city: '',
        state: '',
        postalCode: '',
        countryCode: 'US',
      });
    }
  }, [showAddressFields, form]);

  const requiredContactTypes = useMemo(() => {
    const required = new Set<RecipientContactContactType>();
    effectiveConfig.requiredFields.contacts?.forEach((type) =>
      required.add(type)
    );
    paymentTypes.forEach((type) => {
      const methodConfig = effectiveConfig.paymentMethods.configs[type];
      methodConfig?.requiredFields.contacts?.forEach((contactType) =>
        required.add(contactType)
      );
    });
    return required;
  }, [
    paymentTypes,
    effectiveConfig.requiredFields.contacts,
    effectiveConfig.paymentMethods.configs,
  ]);

  const handleFormSubmit = (data: BankAccountFormData) => {
    // Clean up the data before submission
    const cleanedData = { ...data };

    // Remove address if it wasn't required/shown
    if (!showAddressFields || !cleanedData.address) {
      delete cleanedData.address;
    } else {
      // Clean up empty optional address fields
      const { address } = cleanedData;
      if (!address.addressLine2?.trim()) {
        delete address.addressLine2;
      }
      if (!address.addressLine3?.trim()) {
        delete address.addressLine3;
      }
    }

    // Remove contacts if not required
    if (requiredContactTypes.size === 0) {
      delete cleanedData.contacts;
    }

    // Remove useSameRoutingNumber helper field (not part of API payload)
    delete cleanedData.useSameRoutingNumber;

    onSubmit(cleanedData);
  };

  // Handle step 1 continue - validate selection fields
  const handleStep1Continue = async () => {
    const isValid = await form.trigger(['accountType', 'paymentTypes']);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  // Handle step 2 back button
  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="eb-flex eb-min-h-0 eb-flex-1 eb-flex-col"
      >
        <div
          className={`eb-min-h-0 eb-flex-1 eb-overflow-y-auto ${embedded ? 'eb-px-4' : 'eb-px-6'}`}
        >
          <div className="eb-space-y-4 eb-py-4">
            {alert}
            {/* Step 1: Account Type & Payment Method Selection */}
            {currentStep === 1 && (
              <div className="eb-space-y-6">
                {/* Account Holder Type */}
                {effectiveConfig.accountHolder.allowIndividual &&
                  effectiveConfig.accountHolder.allowOrganization && (
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('accountHolder.selectType')}</FormLabel>
                          {config.readonlyFields?.accountType ? (
                            <div className="eb-rounded-md eb-border eb-bg-muted eb-px-3 eb-py-2 eb-text-sm eb-font-medium">
                              <div className="eb-flex eb-items-center eb-gap-2">
                                {field.value === 'INDIVIDUAL' ? (
                                  <>
                                    <UserIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                                    <span>{t('accountHolder.individual')}</span>
                                  </>
                                ) : (
                                  <>
                                    <BuildingIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                                    <span>
                                      {t('accountHolder.organization')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="eb-h-12">
                                  <SelectValue
                                    placeholder={t(
                                      'accountHolder.choosePlaceholder'
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {config.accountHolder.allowIndividual && (
                                  <SelectItem value="INDIVIDUAL">
                                    <div className="eb-flex eb-items-center eb-gap-2">
                                      <UserIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                                      <span>
                                        {t('accountHolder.individual')}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )}
                                {config.accountHolder.allowOrganization && (
                                  <SelectItem value="ORGANIZATION">
                                    <div className="eb-flex eb-items-center eb-gap-2">
                                      <BuildingIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                                      <span>
                                        {t('accountHolder.organization')}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                {/* Payment Methods Selection */}
                <FormField
                  control={form.control}
                  name="paymentTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('paymentMethods.selectAtLeastOne')}
                      </FormLabel>
                      <PaymentMethodSelector
                        selectedTypes={field.value}
                        onChange={field.onChange}
                        availableTypes={
                          effectiveConfig.paymentMethods.available
                        }
                        configs={effectiveConfig.paymentMethods.configs}
                        allowMultiple={
                          effectiveConfig.paymentMethods.allowMultiple
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Detailed Form */}
            {currentStep === 2 && (
              <div className="eb-space-y-4">
                {/* Account Holder Details */}
                {accountType === 'INDIVIDUAL' ? (
                  <>
                    {effectiveConfig.accountHolder.prefillFromClient &&
                    individualParties.length > 0 &&
                    !recipient ? (
                      <>
                        <Alert noTitle variant="informative">
                          <InfoIcon className="eb-h-4 eb-w-4" />
                          <AlertDescription>
                            {individualParties.length === 1
                              ? t('alerts.individualOnlyAccountsSingle')
                              : t('alerts.individualOnlyAccountsMultiple')}
                          </AlertDescription>
                        </Alert>
                        {individualParties.length === 1 ? (
                          <IndividualReadonlyField
                            individual={individualParties[0]}
                          />
                        ) : (
                          <IndividualSelector
                            control={form.control}
                            individuals={individualParties}
                            selectedFirstName={form.watch('firstName')}
                            selectedLastName={form.watch('lastName')}
                            onSelect={(individual) => {
                              form.setValue('firstName', individual.firstName);
                              form.setValue('lastName', individual.lastName);
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                        <StandardFormField
                          control={form.control}
                          name="firstName"
                          type="text"
                          label={
                            effectiveConfig.content.fieldLabels?.firstName ||
                            t('fields.firstName.label')
                          }
                          placeholder={t('fields.firstName.placeholder')}
                          required
                          readonly={effectiveConfig.readonlyFields?.firstName}
                          disabled={isLoading}
                          inputProps={{ autoFocus: true }}
                        />
                        <StandardFormField
                          control={form.control}
                          name="lastName"
                          type="text"
                          label={
                            effectiveConfig.content.fieldLabels?.lastName ||
                            t('fields.lastName.label')
                          }
                          placeholder={t('fields.lastName.placeholder')}
                          required
                          readonly={effectiveConfig.readonlyFields?.lastName}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {effectiveConfig.accountHolder.prefillFromClient &&
                      organizationName &&
                      !recipient && (
                        <Alert noTitle variant="informative">
                          <InfoIcon className="eb-h-4 eb-w-4" />
                          <AlertDescription>
                            {t('alerts.organizationOnlyAccounts')}
                          </AlertDescription>
                        </Alert>
                      )}
                    <StandardFormField
                      control={form.control}
                      name="businessName"
                      type="text"
                      label={
                        effectiveConfig.content.fieldLabels?.businessName ||
                        t('fields.businessName.label')
                      }
                      placeholder={t('fields.businessName.placeholder')}
                      required
                      readonly={effectiveConfig.readonlyFields?.businessName}
                      disabled={isLoading}
                      inputProps={{ autoFocus: true }}
                    />
                  </>
                )}

                {/* Bank Account Details */}
                <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                  <StandardFormField
                    control={form.control}
                    name="accountNumber"
                    type="text"
                    label={
                      effectiveConfig.content.fieldLabels?.accountNumber ||
                      t('fields.accountNumber.label')
                    }
                    placeholder={t('fields.accountNumber.placeholder')}
                    required
                    readonly={effectiveConfig.readonlyFields?.accountNumber}
                    disabled={isLoading}
                  />
                  <StandardFormField
                    control={form.control}
                    name="bankAccountType"
                    type="select"
                    label={
                      effectiveConfig.content.fieldLabels?.bankAccountType ||
                      t('fields.accountType.label')
                    }
                    placeholder={t('fields.accountType.placeholder')}
                    required
                    readonly={effectiveConfig.readonlyFields?.bankAccountType}
                    disabled={isLoading}
                    options={[
                      { value: 'CHECKING', label: t('accountTypes.checking') },
                      { value: 'SAVINGS', label: t('accountTypes.savings') },
                    ]}
                  />
                </div>

                {/* Routing Numbers */}
                <RoutingNumberFields
                  control={form.control}
                  paymentMethods={paymentTypes}
                  useSameForAll={useSameRoutingNumber ?? true}
                  onUseSameForAllChange={(value) => {
                    form.setValue('useSameRoutingNumber', value);

                    if (value) {
                      // When switching to "same for all", use the first method's routing number
                      // and apply it to all other payment methods
                      const currentRoutingNumbers =
                        form.getValues('routingNumbers') || [];
                      const sourceRoutingNumber =
                        currentRoutingNumbers[0]?.routingNumber || '';

                      if (sourceRoutingNumber) {
                        const updatedRoutingNumbers = paymentTypes.map(
                          (method) => ({
                            paymentType: method,
                            routingNumber: sourceRoutingNumber,
                          })
                        );
                        form.setValue('routingNumbers', updatedRoutingNumbers);
                      }
                    }
                  }}
                  configs={effectiveConfig.paymentMethods.configs}
                  disabled={isLoading}
                />

                {/* Address Fields */}
                {showAddressFields &&
                  (() => {
                    const addressMethods = getRequiredPaymentMethods(
                      'address',
                      paymentTypes,
                      effectiveConfig.paymentMethods.configs
                    );
                    const addressReason = formatRequiredMessage(addressMethods);
                    return (
                      <fieldset className="eb-space-y-3 eb-rounded-lg eb-border eb-p-4 eb-pt-1">
                        <legend className="eb-flex eb-items-center eb-gap-2 eb-px-2 eb-text-sm eb-font-semibold">
                          {t('address.legend')}
                          {addressReason && (
                            <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded-full eb-bg-informative-accent eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-informative">
                              <InfoIcon className="eb-h-3 eb-w-3" />
                              {addressReason}
                            </span>
                          )}
                        </legend>
                        <div className="eb-grid eb-gap-3">
                          <StandardFormField
                            control={form.control}
                            name="address.addressLine1"
                            type="text"
                            label={
                              effectiveConfig.content.fieldLabels
                                ?.primaryAddressLine ||
                              t('address.streetAddress.label')
                            }
                            placeholder={t('address.streetAddress.placeholder')}
                            required
                            disabled={isLoading}
                          />
                          <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                            <StandardFormField
                              control={form.control}
                              name="address.addressLine2"
                              type="text"
                              label={
                                effectiveConfig.content.fieldLabels
                                  ?.secondaryAddressLine ||
                                t('address.addressLine2.label')
                              }
                              placeholder={t(
                                'address.addressLine2.placeholder'
                              )}
                              disabled={isLoading}
                            />
                            <StandardFormField
                              control={form.control}
                              name="address.addressLine3"
                              type="text"
                              label={
                                effectiveConfig.content.fieldLabels
                                  ?.tertiaryAddressLine ||
                                t('address.addressLine3.label')
                              }
                              placeholder={t(
                                'address.addressLine3.placeholder'
                              )}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-3">
                            <StandardFormField
                              control={form.control}
                              name="address.city"
                              type="text"
                              label={t('address.city.label')}
                              placeholder={t('address.city.placeholder')}
                              required
                              className="md:eb-col-span-1"
                              disabled={isLoading}
                            />
                            <StandardFormField
                              control={form.control}
                              name="address.state"
                              type={useStateTextField ? 'text' : 'us-state'}
                              label={t('address.state.label')}
                              placeholder={t('address.state.placeholder')}
                              required
                              inputProps={
                                useStateTextField
                                  ? { maxLength: 34 }
                                  : undefined
                              }
                              disabled={isLoading}
                            />
                            <StandardFormField
                              control={form.control}
                              name="address.postalCode"
                              type="text"
                              label={t('address.postalCode.label')}
                              placeholder={t('address.postalCode.placeholder')}
                              required
                              inputProps={{ maxLength: 10 }}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </fieldset>
                    );
                  })()}

                {/* Contact Information - Only show if required */}
                {requiredContactTypes.size > 0 && (
                  <FormField
                    control={form.control}
                    name="contacts"
                    render={({ field }) => (
                      <FormItem>
                        <ContactFields
                          value={field.value}
                          onChange={field.onChange}
                          requiredTypes={requiredContactTypes}
                          paymentTypes={paymentTypes}
                          configs={effectiveConfig.paymentMethods.configs}
                          disabled={isLoading}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Certification */}
                {effectiveConfig.requiredFields.certification && (
                  <>
                    <Separator />
                    <FormField
                      control={form.control}
                      name="certify"
                      render={({ field }) => (
                        <FormItem>
                          <div className="eb-flex eb-items-start eb-space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="eb-mt-0.5"
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormLabel className="eb-text-sm eb-font-normal eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                              {effectiveConfig.content.certificationText}
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Use plain div when embedded, DialogFooter when in dialog context */}
        {embedded ? (
          <div className="eb-flex eb-shrink-0 eb-flex-col-reverse eb-gap-3 eb-p-4 sm:eb-flex-row sm:eb-justify-end">
            {currentStep === 1 && (
              <>
                {onCancel && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={onCancel}
                    className="eb-w-full sm:eb-w-auto"
                  >
                    {effectiveConfig.content.cancelButtonText ||
                      t('navigation.cancel')}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleStep1Continue}
                  className="eb-w-full sm:eb-w-auto sm:eb-min-w-[200px]"
                >
                  {t('navigation.continueToAccountDetails')} <ArrowRightIcon />
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={skipStepOne && onCancel ? onCancel : handleStep2Back}
                  disabled={isLoading}
                  className="eb-w-full sm:eb-w-auto"
                >
                  <ArrowLeftIcon />{' '}
                  {skipStepOne ? t('navigation.cancel') : t('navigation.back')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="eb-w-full sm:eb-w-auto sm:eb-min-w-[120px]"
                >
                  {isLoading && (
                    <Loader2Icon className="eb-mr-2 eb-h-4 eb-w-4 eb-animate-spin" />
                  )}
                  {isLoading
                    ? effectiveConfig.content.loadingMessage
                    : effectiveConfig.content.submitButtonText}
                </Button>
              </>
            )}
          </div>
        ) : (
          <DialogFooter className="eb-shrink-0 eb-gap-3 eb-border-t eb-bg-muted/10 eb-p-6 eb-py-4">
            {currentStep === 1 && (
              <>
                {onCancel && (
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={onCancel}
                      className="eb-w-full sm:eb-w-auto"
                    >
                      {effectiveConfig.content.cancelButtonText ||
                        t('navigation.cancel')}
                    </Button>
                  </DialogClose>
                )}
                <Button
                  type="button"
                  onClick={handleStep1Continue}
                  className="eb-w-full sm:eb-w-auto sm:eb-min-w-[200px]"
                >
                  {t('navigation.continueToAccountDetails')} <ArrowRightIcon />
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleStep2Back}
                  disabled={isLoading}
                  className="eb-w-full sm:eb-w-auto"
                >
                  <ArrowLeftIcon /> {t('navigation.back')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="eb-w-full sm:eb-w-auto sm:eb-min-w-[120px]"
                >
                  {isLoading && (
                    <Loader2Icon className="eb-mr-2 eb-h-4 eb-w-4 eb-animate-spin" />
                  )}
                  {isLoading
                    ? effectiveConfig.content.loadingMessage
                    : effectiveConfig.content.submitButtonText}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </form>
    </Form>
  );
};
