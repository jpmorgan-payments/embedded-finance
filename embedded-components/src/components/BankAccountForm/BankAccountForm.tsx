import { FC, useMemo, useState } from 'react';
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

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
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

import { createBankAccountFormSchema } from './BankAccountForm.schema';
import type {
  BankAccountFormData,
  BankAccountFormProps,
  ContactType,
  PaymentMethodType,
} from './BankAccountForm.types';

/**
 * PaymentMethodSelector - Compact checkbox selector for payment methods
 */
interface PaymentMethodSelectorProps {
  selectedTypes: PaymentMethodType[];
  onChange: (types: PaymentMethodType[]) => void;
  availableTypes: PaymentMethodType[];
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
  const handleToggle = (type: PaymentMethodType) => {
    const config = configs[type];

    // Don't allow deselecting locked payment methods
    if (config?.locked && selectedTypes.includes(type)) {
      return;
    }

    let newTypes: PaymentMethodType[];

    if (allowMultiple) {
      if (selectedTypes.includes(type)) {
        // Don't allow removing if locked
        if (config?.locked) {
          return;
        }
        newTypes = selectedTypes.filter((t) => t !== type);
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
  const getPaymentIcon = (type: PaymentMethodType) => {
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
              className={`eb-flex eb-flex-1 eb-items-center eb-gap-3 eb-rounded-lg eb-border eb-bg-card eb-p-4 eb-transition-all ${
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
              />
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-primary">
                {getPaymentIcon(type)}
              </div>
              <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
                <span className="eb-font-medium">{config.label}</span>
                {isLocked && (
                  <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded-full eb-bg-informative-accent eb-px-2.5 eb-py-1 eb-text-xs eb-font-medium eb-text-informative">
                    <LockIcon className="eb-h-3 eb-w-3" />
                    Required for Linked Account
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
                    aria-label={`Information about ${config.label}`}
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
 * Helper function to get the reason why a field is conditionally required
 */
const getConditionalRequirementReason = (
  fieldType: 'address' | 'email' | 'phone',
  paymentTypes: PaymentMethodType[],
  configs: BankAccountFormProps['config']['paymentMethods']['configs']
): string | null => {
  const reasons: string[] = [];

  paymentTypes.forEach((type) => {
    const methodConfig = configs[type];
    if (!methodConfig?.enabled) return;

    if (fieldType === 'address' && methodConfig.requiredFields.address) {
      reasons.push(methodConfig.shortLabel);
    } else if (
      fieldType === 'email' &&
      methodConfig.requiredFields.contacts?.includes('EMAIL')
    ) {
      reasons.push(methodConfig.shortLabel);
    } else if (
      fieldType === 'phone' &&
      methodConfig.requiredFields.contacts?.includes('PHONE')
    ) {
      reasons.push(methodConfig.shortLabel);
    }
  });

  if (reasons.length === 0) return null;
  if (reasons.length === 1) return `Required for ${reasons[0]}`;
  if (reasons.length === 2) return `Required for ${reasons[0]} & ${reasons[1]}`;
  return `Required for ${reasons.slice(0, -1).join(', ')} & ${reasons[reasons.length - 1]}`;
};

/**
 * RoutingNumberFields - Dynamic routing number input fields per payment method
 */
interface RoutingNumberFieldsProps {
  value: BankAccountFormData['routingNumbers'];
  onChange: (routingNumbers: BankAccountFormData['routingNumbers']) => void;
  paymentMethods: PaymentMethodType[];
  useSameForAll: boolean;
  onUseSameForAllChange: (value: boolean) => void;
  configs: BankAccountFormProps['config']['paymentMethods']['configs'];
}

const RoutingNumberFields: FC<RoutingNumberFieldsProps> = ({
  value = [],
  onChange,
  paymentMethods,
  useSameForAll,
  onUseSameForAllChange,
  configs,
}) => {
  const handleRoutingNumberChange = (
    paymentType: PaymentMethodType,
    routingNumber: string
  ) => {
    if (useSameForAll) {
      // Update all payment methods with the same routing number
      const updatedRoutingNumbers = paymentMethods.map((method) => ({
        paymentType: method,
        routingNumber,
      }));
      onChange(updatedRoutingNumbers);
    } else {
      // Update only the specific payment method
      const existingIndex = value.findIndex(
        (r) => r.paymentType === paymentType
      );
      const newRoutingNumbers = [...value];

      if (existingIndex >= 0) {
        newRoutingNumbers[existingIndex] = { paymentType, routingNumber };
      } else {
        newRoutingNumbers.push({ paymentType, routingNumber });
      }

      onChange(newRoutingNumbers);
    }
  };

  const getRoutingNumber = (paymentType: PaymentMethodType) => {
    return (
      value.find((r) => r.paymentType === paymentType)?.routingNumber || ''
    );
  };

  // Only show checkbox if there are multiple payment methods
  const showCheckbox = paymentMethods.length > 1;

  // Single payment method - no fieldset, just show the field with payment method in label
  if (!showCheckbox) {
    const singleMethod = paymentMethods[0];
    const config = configs[singleMethod];
    const routingNumber = getRoutingNumber(singleMethod);

    return (
      <FormItem>
        <FormLabel>{config.shortLabel} Routing Number</FormLabel>
        <FormControl>
          <Input
            type="text"
            value={routingNumber}
            onChange={(e) =>
              handleRoutingNumberChange(singleMethod, e.target.value)
            }
            placeholder="Enter 9-digit routing number"
            maxLength={9}
          />
        </FormControl>
      </FormItem>
    );
  }

  // Multiple payment methods - wrap in fieldset
  return (
    <fieldset className="eb-space-y-3 eb-rounded-lg eb-border eb-p-4 eb-pt-1">
      <legend className="eb-px-2 eb-text-sm eb-font-semibold">
        Routing Numbers
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
        />
        <span className="eb-text-sm eb-font-medium eb-leading-none">
          Use same routing number for all payment methods
        </span>
      </label>

      {/* Routing number fields */}
      {useSameForAll ? (
        // Single field when using same for all
        <FormItem>
          <FormLabel>
            {paymentMethods
              .map((method) => configs[method].shortLabel)
              .join(' / ')}{' '}
            Routing Number
          </FormLabel>
          <FormControl>
            <Input
              type="text"
              value={getRoutingNumber(paymentMethods[0])}
              onChange={(e) =>
                handleRoutingNumberChange(paymentMethods[0], e.target.value)
              }
              placeholder="Enter 9-digit routing number"
              maxLength={9}
            />
          </FormControl>
        </FormItem>
      ) : (
        // Individual fields for each payment method
        <div className="eb-space-y-3">
          {paymentMethods.map((method) => {
            const config = configs[method];
            return (
              <FormItem key={method}>
                <FormLabel>{config.shortLabel} Routing Number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={getRoutingNumber(method)}
                    onChange={(e) =>
                      handleRoutingNumberChange(method, e.target.value)
                    }
                    placeholder="Enter 9-digit routing number"
                    maxLength={9}
                  />
                </FormControl>
              </FormItem>
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
  requiredTypes: Set<ContactType>;
  paymentTypes: PaymentMethodType[];
  configs: BankAccountFormProps['config']['paymentMethods']['configs'];
}

const ContactFields: FC<ContactFieldsProps> = ({
  value = [],
  onChange,
  requiredTypes,
  paymentTypes,
  configs,
}) => {
  const handleContactChange = (
    type: ContactType,
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

  const getContactValue = (type: ContactType) => {
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
  const emailReason = showEmail
    ? getConditionalRequirementReason('email', paymentTypes, configs)
    : null;
  const phoneReason = showPhone
    ? getConditionalRequirementReason('phone', paymentTypes, configs)
    : null;

  return (
    <div className="eb-space-y-4">
      <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
        {showEmail && (
          <FormItem>
            <FormLabel>
              <span className="eb-flex eb-items-center eb-gap-2">
                <MailIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                Email
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
                placeholder="Enter email address"
              />
            </FormControl>
          </FormItem>
        )}

        {showPhone && (
          <FormItem>
            <FormLabel>
              <span className="eb-flex eb-items-center eb-gap-2">
                <PhoneIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                Phone
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
                placeholder="Enter phone number"
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
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Create dynamic schema based on config
  const formSchema = useMemo(
    () => createBankAccountFormSchema(config),
    [config]
  );

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: config.accountHolder.defaultType || undefined,
      firstName: recipient?.partyDetails?.firstName || '',
      lastName: recipient?.partyDetails?.lastName || '',
      businessName: recipient?.partyDetails?.businessName || '',
      routingNumbers: [],
      useSameRoutingNumber: true,
      accountNumber: recipient?.account?.number || '',
      bankAccountType: (recipient?.account?.type as any) || 'CHECKING',
      paymentTypes: config.paymentMethods.defaultSelected || [],
      address: recipient?.partyDetails?.address
        ? {
            primaryAddressLine:
              (recipient.partyDetails.address as any).primaryAddressLine ||
              (recipient.partyDetails.address as any).addressLine1 ||
              '',
            secondaryAddressLine:
              (recipient.partyDetails.address as any).secondaryAddressLine ||
              (recipient.partyDetails.address as any).addressLine2,
            tertiaryAddressLine:
              (recipient.partyDetails.address as any).tertiaryAddressLine ||
              (recipient.partyDetails.address as any).addressLine3,
            city: recipient.partyDetails.address.city || '',
            state: recipient.partyDetails.address.state || '',
            postalCode: recipient.partyDetails.address.postalCode || '',
            countryCode: recipient.partyDetails.address.countryCode || 'US',
          }
        : undefined,
      contacts: [],
      certify: false,
    },
  });

  // Watch form values
  const accountType = form.watch('accountType');
  const paymentTypes = form.watch('paymentTypes');
  const useSameRoutingNumber = form.watch('useSameRoutingNumber');

  // Determine required fields based on selected payment methods
  const showAddressFields = useMemo(() => {
    if (config.requiredFields.address) return true;
    return paymentTypes.some((type) => {
      const methodConfig = config.paymentMethods.configs[type];
      return methodConfig?.enabled && methodConfig.requiredFields.address;
    });
  }, [
    paymentTypes,
    config.requiredFields.address,
    config.paymentMethods.configs,
  ]);

  const requiredContactTypes = useMemo(() => {
    const required = new Set<ContactType>();
    config.requiredFields.contacts?.forEach((type) => required.add(type));
    paymentTypes.forEach((type) => {
      const methodConfig = config.paymentMethods.configs[type];
      methodConfig?.requiredFields.contacts?.forEach((contactType) =>
        required.add(contactType)
      );
    });
    return required;
  }, [
    paymentTypes,
    config.requiredFields.contacts,
    config.paymentMethods.configs,
  ]);

  const handleFormSubmit = (data: BankAccountFormData) => {
    onSubmit(data);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="eb-flex eb-h-96 eb-items-center eb-justify-center">
        <div className="eb-text-center">
          <Loader2Icon className="eb-mx-auto eb-mb-4 eb-h-10 eb-w-10 eb-animate-spin eb-text-primary" />
          <p className="eb-text-sm eb-text-muted-foreground">
            {config.content.loadingMessage}
          </p>
        </div>
      </div>
    );
  }

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
        className="eb-flex eb-flex-col"
      >
        <div className="eb-max-h-[calc(90vh-180px)] eb-overflow-y-auto eb-px-6">
          <div className="eb-space-y-4 eb-py-4">
            {alert}
            {/* Step 1: Account Type & Payment Method Selection */}
            {currentStep === 1 && (
              <div className="eb-space-y-6">
                {/* Account Holder Type */}
                {config.accountHolder.allowIndividual &&
                  config.accountHolder.allowOrganization && (
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="eb-text-base eb-font-semibold">
                            Select account holder type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="eb-h-12">
                                <SelectValue placeholder="Choose account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {config.accountHolder.allowIndividual && (
                                <SelectItem value="INDIVIDUAL">
                                  <div className="eb-flex eb-items-center eb-gap-2">
                                    <UserIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                                    <span>Individual / Personal Account</span>
                                  </div>
                                </SelectItem>
                              )}
                              {config.accountHolder.allowOrganization && (
                                <SelectItem value="ORGANIZATION">
                                  <div className="eb-flex eb-items-center eb-gap-2">
                                    <BuildingIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                                    <span>Business / Organization Account</span>
                                  </div>
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
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
                      <FormLabel className="eb-text-base eb-font-semibold">
                        Select at least one payment method
                      </FormLabel>
                      <PaymentMethodSelector
                        selectedTypes={field.value}
                        onChange={field.onChange}
                        availableTypes={config.paymentMethods.available}
                        configs={config.paymentMethods.configs}
                        allowMultiple={config.paymentMethods.allowMultiple}
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
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    <StandardFormField
                      control={form.control}
                      name="firstName"
                      type="text"
                      label={
                        config.content.fieldLabels?.firstName || 'First Name'
                      }
                      placeholder="Enter first name"
                      required
                      inputProps={{ autoFocus: true }}
                    />
                    <StandardFormField
                      control={form.control}
                      name="lastName"
                      type="text"
                      label={
                        config.content.fieldLabels?.lastName || 'Last Name'
                      }
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                ) : (
                  <StandardFormField
                    control={form.control}
                    name="businessName"
                    type="text"
                    label={
                      config.content.fieldLabels?.businessName ||
                      'Business Name'
                    }
                    placeholder="Enter business or organization name"
                    required
                    inputProps={{ autoFocus: true }}
                  />
                )}

                {/* Bank Account Details */}
                <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                  <StandardFormField
                    control={form.control}
                    name="accountNumber"
                    type="text"
                    label={
                      config.content.fieldLabels?.accountNumber ||
                      'Account Number'
                    }
                    placeholder="Enter account number"
                    required
                  />
                  <StandardFormField
                    control={form.control}
                    name="bankAccountType"
                    type="select"
                    label={
                      config.content.fieldLabels?.bankAccountType ||
                      'Account Type'
                    }
                    placeholder="Select type"
                    required
                    options={[
                      { value: 'CHECKING', label: 'Checking' },
                      { value: 'SAVINGS', label: 'Savings' },
                    ]}
                  />
                </div>

                {/* Routing Numbers */}
                <FormField
                  control={form.control}
                  name="routingNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <RoutingNumberFields
                        value={field.value}
                        onChange={field.onChange}
                        paymentMethods={paymentTypes}
                        useSameForAll={useSameRoutingNumber ?? true}
                        onUseSameForAllChange={(value) =>
                          form.setValue('useSameRoutingNumber', value)
                        }
                        configs={config.paymentMethods.configs}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Fields */}
                {showAddressFields &&
                  (() => {
                    const addressReason = getConditionalRequirementReason(
                      'address',
                      paymentTypes,
                      config.paymentMethods.configs
                    );
                    return (
                      <fieldset className="eb-space-y-3 eb-rounded-lg eb-border eb-p-4 eb-pt-1">
                        <legend className="eb-flex eb-items-center eb-gap-2 eb-px-2 eb-text-sm eb-font-semibold">
                          Address Information
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
                            name="address.primaryAddressLine"
                            type="text"
                            label={
                              config.content.fieldLabels?.primaryAddressLine ||
                              'Street Address'
                            }
                            placeholder="Enter street address"
                            required
                          />
                          <StandardFormField
                            control={form.control}
                            name="address.secondaryAddressLine"
                            type="text"
                            label={
                              config.content.fieldLabels
                                ?.secondaryAddressLine || 'Address Line 2'
                            }
                            placeholder="Enter apartment, suite, unit, etc. (optional)"
                          />
                          <StandardFormField
                            control={form.control}
                            name="address.city"
                            type="text"
                            label="City"
                            placeholder="Enter city"
                            required
                          />
                          <StandardFormField
                            control={form.control}
                            name="address.state"
                            type="us-state"
                            label="State"
                            placeholder="Select state"
                            required
                          />
                          <StandardFormField
                            control={form.control}
                            name="address.postalCode"
                            type="text"
                            label="ZIP Code"
                            placeholder="Enter ZIP code"
                            className="eb-max-w-48"
                            required
                            inputProps={{ maxLength: 10 }}
                          />
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
                          configs={config.paymentMethods.configs}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                {/* Certification */}
                {config.requiredFields.certification && (
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
                            />
                          </FormControl>
                          <FormLabel className="eb-text-sm eb-font-normal eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                            {config.content.certificationText}
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="eb-gap-3 eb-border-t eb-bg-muted/10 eb-p-6 eb-py-4">
          {currentStep === 1 && (
            <>
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={onCancel}
                  className="eb-w-full sm:eb-w-auto"
                >
                  {config.content.cancelButtonText || 'Cancel'}
                </Button>
              )}
              <Button
                type="button"
                onClick={handleStep1Continue}
                className="eb-w-full sm:eb-w-auto sm:eb-min-w-[200px]"
              >
                Continue to Account Details <ArrowRightIcon />
              </Button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={handleStep2Back}
                className="eb-w-full sm:eb-w-auto"
              >
                <ArrowLeftIcon /> Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="eb-w-full sm:eb-w-auto sm:eb-min-w-[120px]"
              >
                {config.content.submitButtonText}
              </Button>
            </>
          )}
        </DialogFooter>
      </form>
    </Form>
  );
};
