export type PaymentMethodType =
  | 'ACH'
  | 'WIRE'
  | 'RTP'
  | 'EMAIL'
  | 'ZELLE'
  | 'VENMO'
  | 'PAYPAL';

// Utility function for deep merging configurations
export function deepMergeConfigs<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMergeConfigs(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

export interface PaymentTypeFieldConfig {
  // Display information
  label: string;
  description: string;
  icon?: string;

  // Fields required when this payment type is selected
  requiredFields: string[];

  // Fields that should be visible but optional when this payment type is selected
  optionalFields: string[];

  // Fields that should be hidden when this payment type is selected
  hiddenFields?: string[];

  // Validation rules specific to this payment type
  validations: {
    [fieldName: string]: {
      pattern?: RegExp;
      maxLength?: number;
      minLength?: number;
      customValidator?: (
        value: any,
        formValues?: Record<string, any>
      ) => boolean | string;
      errorMessage?: string;
    };
  };

  // Country-specific overrides
  countryOverrides?: {
    [countryCode: string]: {
      requiredFields: string[];
      optionalFields: string[];
      hiddenFields?: string[];
      validations: {
        [fieldName: string]: any;
      };
    };
  };

  // Field dependency rules
  fieldDependencies?: {
    [fieldName: string]: {
      dependsOn: string;
      condition: (value: any) => boolean;
      whenTrue: 'show' | 'require' | 'hide';
      whenFalse: 'show' | 'require' | 'hide';
    };
  };

  // Helper text for fields
  helperText?: {
    [fieldName: string]: string;
  };

  // Routing information configuration
  routingConfig?: {
    routingCodeType: string;
    routingNumberLength: number;
    routingNumberPattern: RegExp;
    routingNumberLabel: string;
    routingNumberPlaceholder: string;
  };

  // Transaction limits and characteristics
  characteristics?: {
    settlementTime: string;
    feeStructure: 'low' | 'medium' | 'high';
    maxAmount?: number;
    minAmount?: number;
    availability: string;
    cutoffTimes?: string[];
  };

  // Enabled/disabled state
  enabled: boolean;

  // Future capabilities
  capabilities?: {
    instantSettlement: boolean;
    recurringPayments: boolean;
    internationalSupport: boolean;
    mobileOptimized: boolean;
    requiresRecipientApproval: boolean;
  };
}

export interface RecipientsConfig {
  // Available payment methods for this implementation
  availablePaymentMethods: PaymentMethodType[];

  // Configuration for each payment method
  paymentMethodConfigs?: Record<PaymentMethodType, PaymentTypeFieldConfig>;

  // Global form settings
  globalSettings: {
    allowMultiplePaymentMethods: boolean;
    defaultCountryCode: string;
    defaultCurrency: string;
    requireEmailContact: boolean;
    requirePhoneContact: boolean;
    maxContactsPerRecipient: number;
    enableDuplicateDetection: boolean;
    enableAddressValidation: boolean;
  };

  // UI customization
  uiSettings: {
    showPaymentMethodIcons: boolean;
    showCharacteristics: boolean;
    groupPaymentMethodsByCategory: boolean;
    defaultFormLayout: 'tabs' | 'accordion' | 'single-page';
    enableProgressIndicator: boolean;
  };
}

// Default payment method configurations
export const defaultPaymentMethodConfigs: Record<
  PaymentMethodType,
  PaymentTypeFieldConfig
> = {
  ACH: {
    label: 'ACH Transfer',
    description: 'Automated Clearing House - Standard electronic bank transfer',
    icon: 'building-2',
    enabled: true,
    requiredFields: [
      'account.type',
      'account.number',
      'account.countryCode',
      'account.routingInformation.ACH.routingNumber',
      'account.routingInformation.ACH.routingCodeType',
      'partyDetails.name',
    ],
    optionalFields: [
      'partyDetails.contacts.PHONE.value',
      'partyDetails.contacts.EMAIL.value',
      'partyDetails.address.addressLine1',
      'partyDetails.address.city',
      'partyDetails.address.state',
      'partyDetails.address.postalCode',
      'account.bankName',
    ],
    routingConfig: {
      routingCodeType: 'USABA',
      routingNumberLength: 9,
      routingNumberPattern: /^\d{9}$/,
      routingNumberLabel: 'ACH Routing Number',
      routingNumberPlaceholder: '123456789',
    },
    validations: {
      'account.routingInformation.ACH.routingNumber': {
        pattern: /^\d{9}$/,
        maxLength: 9,
        minLength: 9,
        errorMessage: 'ACH routing number must be exactly 9 digits',
      },
      'account.number': {
        pattern: /^\d{4,17}$/,
        maxLength: 17,
        errorMessage: 'Account number must be between 4 and 17 digits',
      },
    },
    characteristics: {
      settlementTime: '1-3 business days',
      feeStructure: 'low',
      availability: 'Business days only',
      cutoffTimes: ['5:00 PM ET'],
    },
    capabilities: {
      instantSettlement: false,
      recurringPayments: true,
      internationalSupport: false,
      mobileOptimized: true,
      requiresRecipientApproval: false,
    },
    helperText: {
      'account.routingInformation.ACH.routingNumber':
        'The 9-digit ABA routing number found at the bottom of a check',
    },
  },

  WIRE: {
    label: 'Wire Transfer',
    description: 'Traditional bank wire transfer with same-day settlement',
    icon: 'zap',
    enabled: true,
    requiredFields: [
      'account.type',
      'account.number',
      'account.bankName',
      'account.countryCode',
      'account.routingInformation.WIRE.routingNumber',
      'account.routingInformation.WIRE.routingCodeType',
      'partyDetails.address.addressLine1',
      'partyDetails.address.city',
      'partyDetails.address.state',
      'partyDetails.address.postalCode',
      'partyDetails.name',
    ],
    optionalFields: [
      'account.bankAddress',
      'account.intermediaryBankDetails',
      'account.routingInformation.WIRE.additionalInfo',
    ],
    routingConfig: {
      routingCodeType: 'USABA',
      routingNumberLength: 9,
      routingNumberPattern: /^\d{9}$/,
      routingNumberLabel: 'Wire Routing Number',
      routingNumberPlaceholder: '123456789',
    },
    validations: {
      'account.routingInformation.WIRE.routingNumber': {
        pattern: /^\d{9}$/,
        maxLength: 9,
        errorMessage:
          'Wire routing number must be exactly 9 digits for domestic wires',
      },
      'partyDetails.address.addressLine1': {
        minLength: 1,
        maxLength: 34,
        errorMessage: 'Address line 1 is required for wire transfers',
      },
    },
    characteristics: {
      settlementTime: 'Same day',
      feeStructure: 'high',
      availability: 'Business hours only',
      cutoffTimes: ['3:30 PM ET', '6:00 PM ET'],
    },
    capabilities: {
      instantSettlement: true,
      recurringPayments: false,
      internationalSupport: true,
      mobileOptimized: false,
      requiresRecipientApproval: false,
    },
    helperText: {
      'account.routingInformation.WIRE.additionalInfo':
        'Any special instructions for the wire transfer',
    },
  },

  RTP: {
    label: 'Real-Time Payments',
    description: 'Instant payments 24/7/365 with immediate settlement',
    icon: 'clock',
    enabled: true,
    requiredFields: [
      'account.type',
      'account.number',
      'account.routingInformation.RTP.routingNumber',
      'partyDetails.contacts.EMAIL.value',
      'partyDetails.name',
    ],
    optionalFields: ['account.name', 'partyDetails.contacts.PHONE.value'],
    routingConfig: {
      routingCodeType: 'USABA',
      routingNumberLength: 9,
      routingNumberPattern: /^\d{9}$/,
      routingNumberLabel: 'RTP Routing Number',
      routingNumberPlaceholder: '123456789',
    },
    validations: {
      'account.routingInformation.RTP.routingNumber': {
        pattern: /^\d{9}$/,
        maxLength: 9,
        errorMessage: 'RTP routing number must be exactly 9 digits',
      },
      'partyDetails.contacts.EMAIL.value': {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage: 'Please enter a valid email address',
      },
    },
    characteristics: {
      settlementTime: 'Instant',
      feeStructure: 'medium',
      maxAmount: 100000,
      availability: '24/7/365',
      cutoffTimes: [],
    },
    capabilities: {
      instantSettlement: true,
      recurringPayments: true,
      internationalSupport: false,
      mobileOptimized: true,
      requiresRecipientApproval: false,
    },
  },

  // Future payment methods
  EMAIL: {
    label: 'Email Money Transfer',
    description: 'Send money via email with security questions',
    icon: 'mail',
    enabled: true,
    requiredFields: ['partyDetails.contacts.EMAIL.value', 'partyDetails.name'],
    optionalFields: ['partyDetails.contacts.PHONE.value'],
    hiddenFields: [
      'account.type',
      'account.number',
      'account.routingInformation',
    ],
    validations: {
      'partyDetails.contacts.EMAIL.value': {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage: 'Please enter a valid email address',
      },
    },
    characteristics: {
      settlementTime: 'Instant to 30 minutes',
      feeStructure: 'low',
      maxAmount: 10000,
      availability: '24/7',
    },
    capabilities: {
      instantSettlement: true,
      recurringPayments: false,
      internationalSupport: true,
      mobileOptimized: true,
      requiresRecipientApproval: true,
    },
    helperText: {
      'partyDetails.contacts.EMAIL.value':
        'The email where payment instructions will be sent',
    },
  },

  // Popular payment apps
  ZELLE: {
    label: 'Zelle',
    description: 'Send money directly between bank accounts',
    icon: 'smartphone',
    enabled: true,
    requiredFields: ['partyDetails.contacts.EMAIL.value', 'partyDetails.name'],
    optionalFields: ['partyDetails.contacts.PHONE.value'],
    hiddenFields: ['account.routingInformation'],
    validations: {
      'partyDetails.contacts.EMAIL.value': {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage: 'Please enter the email address registered with Zelle',
      },
    },
    characteristics: {
      settlementTime: 'Minutes',
      feeStructure: 'low',
      maxAmount: 5000,
      availability: '24/7',
    },
    capabilities: {
      instantSettlement: true,
      recurringPayments: false,
      internationalSupport: false,
      mobileOptimized: true,
      requiresRecipientApproval: false,
    },
  },

  VENMO: {
    label: 'Venmo',
    description: 'Social payments with friends and family',
    icon: 'users',
    enabled: false,
    requiredFields: ['partyDetails.venmoHandle', 'partyDetails.name'],
    optionalFields: ['partyDetails.contacts.PHONE.value'],
    hiddenFields: ['account.routingInformation', 'partyDetails.address'],
    validations: {
      'partyDetails.venmoHandle': {
        pattern: /^@[a-zA-Z0-9_-]{5,30}$/,
        errorMessage: 'Please enter a valid Venmo handle (e.g., @username)',
      },
    },
    characteristics: {
      settlementTime: 'Instant to 1-3 business days',
      feeStructure: 'low',
      maxAmount: 4999.99,
      availability: '24/7',
    },
    capabilities: {
      instantSettlement: false,
      recurringPayments: false,
      internationalSupport: false,
      mobileOptimized: true,
      requiresRecipientApproval: true,
    },
  },

  PAYPAL: {
    label: 'PayPal',
    description: 'Digital wallet and online payments',
    icon: 'credit-card',
    enabled: true,
    requiredFields: ['partyDetails.contacts.EMAIL.value', 'partyDetails.name'],
    optionalFields: ['partyDetails.contacts.PHONE.value'],
    hiddenFields: ['account.routingInformation'],
    validations: {
      'partyDetails.contacts.EMAIL.value': {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage:
          'Please enter the email address associated with PayPal account',
      },
    },
    characteristics: {
      settlementTime: 'Instant to 1 business day',
      feeStructure: 'medium',
      availability: '24/7',
    },
    capabilities: {
      instantSettlement: false,
      recurringPayments: true,
      internationalSupport: true,
      mobileOptimized: true,
      requiresRecipientApproval: false,
    },
  },
};

// Default comprehensive Recipients configuration
export const defaultRecipientsConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'WIRE', 'RTP'],
  paymentMethodConfigs: defaultPaymentMethodConfigs,
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 3,
    enableDuplicateDetection: true,
    enableAddressValidation: true,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: true,
  },
};

// Utility function to merge user config with default config
export function createRecipientsConfig(
  userConfig?: Partial<RecipientsConfig>
): RecipientsConfig {
  if (!userConfig) {
    return defaultRecipientsConfig;
  }

  return deepMergeConfigs(defaultRecipientsConfig, userConfig);
}

// Utility function to get available payment methods based on config
export function getAvailablePaymentMethods(
  config: RecipientsConfig
): PaymentMethodType[] {
  return config.availablePaymentMethods.filter(
    (method) => config?.paymentMethodConfigs?.[method]?.enabled !== false
  );
}

// Utility function to check if multiple payment methods are allowed
export function isMultiplePaymentMethodsAllowed(
  config: RecipientsConfig
): boolean {
  const availableMethods = getAvailablePaymentMethods(config);
  return (
    config.globalSettings.allowMultiplePaymentMethods &&
    availableMethods.length > 1
  );
}

// Helper function to check if any field is required for selected payment methods
export function isFieldRequired(
  config: RecipientsConfig,
  fieldPath: string,
  selectedPaymentMethods: PaymentMethodType[]
): boolean {
  return selectedPaymentMethods.some((method) => {
    const methodConfig = config?.paymentMethodConfigs?.[method];
    return (
      methodConfig?.enabled && methodConfig.requiredFields.includes(fieldPath)
    );
  });
}

// Helper function to check if address is required for selected payment methods
export function isAddressRequired(
  config: RecipientsConfig,
  selectedPaymentMethods: PaymentMethodType[]
): boolean {
  const addressFields = [
    'partyDetails.address.addressLine1',
    'partyDetails.address.city',
    'partyDetails.address.state',
  ];

  return addressFields.some((fieldPath) =>
    isFieldRequired(config, fieldPath, selectedPaymentMethods)
  );
}

// Helper function to get which specific address fields are required
export function getRequiredAddressFields(
  config: RecipientsConfig,
  selectedPaymentMethods: PaymentMethodType[]
): string[] {
  const addressFieldMap = {
    'partyDetails.address.addressLine1': 'addressLine1',
    'partyDetails.address.city': 'city',
    'partyDetails.address.state': 'state',
    'partyDetails.address.postalCode': 'postalCode',
    'partyDetails.address.addressLine2': 'addressLine2',
    'partyDetails.address.addressLine3': 'addressLine3',
  };

  const requiredFields: string[] = [];

  for (const [configPath, fieldName] of Object.entries(addressFieldMap)) {
    if (isFieldRequired(config, configPath, selectedPaymentMethods)) {
      requiredFields.push(fieldName);
    }
  }

  return requiredFields;
}

// Helper function to get payment methods that require address
export function getPaymentMethodsRequiringAddress(
  config: RecipientsConfig,
  selectedPaymentMethods: PaymentMethodType[]
): PaymentMethodType[] {
  return selectedPaymentMethods.filter((method) => {
    const methodConfig = config?.paymentMethodConfigs?.[method];
    if (!methodConfig?.enabled) return false;

    return methodConfig.requiredFields.some((field) =>
      field.startsWith('partyDetails.address.')
    );
  });
}
