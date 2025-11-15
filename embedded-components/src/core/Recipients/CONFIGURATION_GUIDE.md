# Recipients Component Configuration Guide

## Overview

The Recipients component now supports a flexible configuration system that allows you to customize payment methods, validation rules, and UI behavior to match your specific business requirements. This guide explains how to use the configuration system effectively.

## Configuration Architecture

### RecipientsConfig Interface

```typescript
interface RecipientsConfig {
  availablePaymentMethods: RoutingInformationTransactionType[];
  paymentMethodConfigs: Record<
    RoutingInformationTransactionType,
    PaymentTypeFieldConfig
  >;
  globalSettings: GlobalSettings;
  uiSettings: UISettings;
}
```

### Supported Payment Methods

#### Traditional Banking

- **ACH**: Automated Clearing House transfers (1-3 business days)
- **WIRE**: Wire transfers (same day settlement)
- **FEDWIRE**: Federal Reserve wire transfers
- **CHECK**: Physical check payments

#### Real-Time Payments

- **RTP**: Real-Time Payments network (instant)
- **INSTANT**: Instant transfers via debit card rails

#### International

- **INTERNATIONAL**: Cross-border wire transfers
- **SWIFT**: SWIFT network transfers
- **SEPA**: Single Euro Payments Area transfers
- **FASTER_PAYMENTS**: UK Faster Payments system

#### Digital/Mobile Wallets

- **ZELLE**: Zelle digital payments
- **VENMO**: Venmo social payments
- **PAYPAL**: PayPal digital wallet
- **APPLE_PAY**: Apple Pay mobile payments
- **GOOGLE_PAY**: Google Pay mobile payments

#### Future Technologies

- **CRYPTO**: Cryptocurrency payments
- **EMAIL**: Email money transfers

## Configuration Examples

### Basic Usage

```typescript
import { Recipients, defaultRecipientsConfig } from '@jpmorgan-payments/embedded-finance-components';

// Use default configuration (ACH, WIRE, RTP)
<Recipients
  config={defaultRecipientsConfig}
  showCreateButton={true}
  enableVerification={true}
/>
```

### Custom Configuration

```typescript
import { Recipients, type RecipientsConfig } from '@jpmorgan-payments/embedded-finance-components';
import { defaultPaymentMethodConfigs } from '@jpmorgan-payments/embedded-finance-components';

const customConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'RTP', 'ZELLE'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    ACH: {
      ...defaultPaymentMethodConfigs.ACH,
      enabled: true,
      requiredFields: [
        'account.type',
        'account.number',
        'account.routingInformation.ACH.routingNumber',
        'partyDetails.name',
        'partyDetails.contacts.EMAIL.value' // Make email required for ACH
      ]
    },
    RTP: {
      ...defaultPaymentMethodConfigs.RTP,
      enabled: true,
      characteristics: {
        ...defaultPaymentMethodConfigs.RTP.characteristics,
        maxAmount: 25000 // Lower limit for your use case
      }
    },
    ZELLE: {
      ...defaultPaymentMethodConfigs.ZELLE,
      enabled: true
    }
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 2,
    enableDuplicateDetection: true,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: false,
  }
};

<Recipients config={customConfig} />
```

## Payment Method Configuration

### PaymentTypeFieldConfig Structure

```typescript
interface PaymentTypeFieldConfig {
  // Display information
  label: string;
  description: string;
  icon?: string;
  enabled: boolean;

  // Field requirements
  requiredFields: string[];
  optionalFields: string[];
  hiddenFields?: string[];

  // Validation rules
  validations: Record<string, ValidationRule>;

  // Country-specific overrides
  countryOverrides?: Record<string, CountryOverride>;

  // Field dependencies (conditional logic)
  fieldDependencies?: Record<string, FieldDependency>;

  // Helper text
  helperText?: Record<string, string>;

  // Routing configuration
  routingConfig?: RoutingConfig;

  // Transaction characteristics
  characteristics?: TransactionCharacteristics;

  // Future capabilities
  capabilities?: PaymentCapabilities;
}
```

### Field Path Reference

Use dot notation to reference nested fields:

- `partyDetails.name` - Recipient name
- `partyDetails.firstName` - Individual first name
- `partyDetails.lastName` - Individual last name
- `partyDetails.businessName` - Organization name
- `partyDetails.address.addressLine1` - Address line 1
- `partyDetails.address.city` - City
- `partyDetails.address.state` - State/Province
- `partyDetails.address.postalCode` - ZIP/Postal code
- `partyDetails.contacts.EMAIL.value` - Email address
- `partyDetails.contacts.PHONE.value` - Phone number
- `account.type` - Account type (CHECKING/SAVINGS)
- `account.number` - Account number
- `account.bankName` - Bank name
- `account.routingInformation.{METHOD}.routingNumber` - Routing number for specific method
- `account.routingInformation.{METHOD}.routingCodeType` - Routing code type

### Conditional Field Logic

Use `fieldDependencies` to show/hide/require fields based on other field values:

```typescript
fieldDependencies: {
  'partyDetails.firstName': {
    dependsOn: 'partyDetails.type',
    condition: (value) => value === 'INDIVIDUAL',
    whenTrue: 'require',
    whenFalse: 'hide'
  },
  'partyDetails.businessName': {
    dependsOn: 'partyDetails.type',
    condition: (value) => value === 'ORGANIZATION',
    whenTrue: 'require',
    whenFalse: 'hide'
  }
}
```

### Custom Validation

Create custom validation functions for complex business logic:

```typescript
validations: {
  'account.routingInformation.ACH.routingNumber': {
    customValidator: (value, formValues) => {
      // Custom routing number validation
      if (!isValidRoutingNumber(value)) {
        return 'Invalid routing number checksum';
      }
      return true;
    }
  }
}
```

### Country-Specific Overrides

Define different requirements for different countries:

```typescript
countryOverrides: {
  'GB': {
    requiredFields: [
      'account.routingInformation.SORT_CODE.routingNumber',
      'account.number'
    ],
    validations: {
      'account.routingInformation.SORT_CODE.routingNumber': {
        pattern: /^\d{6}$/,
        errorMessage: 'UK Sort Code must be exactly 6 digits'
      }
    }
  }
}
```

## Global Settings

### Configuration Options

```typescript
interface GlobalSettings {
  allowMultiplePaymentMethods: boolean; // Allow selecting multiple payment methods
  defaultCountryCode: string; // Default country (e.g., 'US')
  defaultCurrency: string; // Default currency (e.g., 'USD')
  requireEmailContact: boolean; // Force email contact requirement
  requirePhoneContact: boolean; // Force phone contact requirement
  maxContactsPerRecipient: number; // Maximum number of contacts
  enableDuplicateDetection: boolean; // Detect potential duplicate recipients
  enableAddressValidation: boolean; // Enable address validation
}
```

## UI Settings

### Configuration Options

```typescript
interface UISettings {
  showPaymentMethodIcons: boolean; // Show icons for payment methods
  showCharacteristics: boolean; // Show settlement time, fees, etc.
  groupPaymentMethodsByCategory: boolean; // Group similar payment methods
  defaultFormLayout: 'tabs' | 'accordion' | 'single-page';
  enableProgressIndicator: boolean; // Show form progress
}
```

## Industry-Specific Configurations

### Small Business

```typescript
const smallBusinessConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'RTP', 'ZELLE', 'VENMO'],
  // ... simplified validation, lower limits
};
```

### Enterprise

```typescript
const enterpriseConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'WIRE', 'FEDWIRE', 'INTERNATIONAL'],
  // ... comprehensive validation, higher limits
};
```

### Fintech

```typescript
const fintechConfig: RecipientsConfig = {
  availablePaymentMethods: ['RTP', 'INSTANT', 'CRYPTO', 'APPLE_PAY'],
  // ... modern payment methods, flexible validation
};
```

### International Trade

```typescript
const internationalConfig: RecipientsConfig = {
  availablePaymentMethods: ['WIRE', 'INTERNATIONAL', 'SWIFT', 'SEPA'],
  // ... international focus, multi-currency support
};
```

## Form Behavior

### Multiselect Payment Methods

When `allowMultiplePaymentMethods` is enabled:

- Users can select multiple payment methods
- Form shows union of all required fields
- Separate routing information for each method
- Option to use same routing number for all methods

### Single Payment Method Mode

When `allowMultiplePaymentMethods` is disabled:

- Users select one payment method
- Form shows only relevant fields for that method
- Simplified routing information section

### Dynamic Field Management

Fields are shown/hidden based on:

1. Selected payment methods
2. Party type (Individual vs Organization)
3. Country selection
4. Custom field dependencies

## Validation Behavior

### Field Validation Priority

1. **Required Fields**: Must be completed based on selected payment methods
2. **Format Validation**: Pattern matching (regex, custom functions)
3. **Business Logic**: Custom validators for complex rules
4. **Cross-Field Validation**: Dependencies between fields

### Error Handling

- Real-time validation as user types
- Clear, actionable error messages
- Field-level error indicators
- Form submission prevention with incomplete data

## Migration Guide

### From Simple Payment Types

**Before:**

```typescript
<Recipients
  initialRecipientType="RECIPIENT"
  showCreateButton={true}
/>
```

**After:**

```typescript
<Recipients
  initialRecipientType="RECIPIENT"
  showCreateButton={true}
  config={defaultRecipientsConfig} // Uses ACH, WIRE, RTP
/>
```

### Custom Payment Methods

**Before:** Limited to predefined payment types

**After:**

```typescript
const customConfig = {
  availablePaymentMethods: ['ACH', 'ZELLE'],
  paymentMethodConfigs: {
    ACH: { ...defaultPaymentMethodConfigs.ACH, enabled: true },
    ZELLE: { ...defaultPaymentMethodConfigs.ZELLE, enabled: true }
  },
  // ... other settings
};

<Recipients config={customConfig} />
```

## Best Practices

### Performance

1. **Lazy Load Configs**: Only load payment method configs for enabled methods
2. **Memoize Validation**: Cache validation results for expensive operations
3. **Debounce Input**: Delay validation until user stops typing

### User Experience

1. **Progressive Disclosure**: Show fields progressively based on selections
2. **Smart Defaults**: Pre-populate common values
3. **Clear Feedback**: Provide immediate validation feedback
4. **Help Text**: Include contextual help for complex fields

### Maintenance

1. **Version Control**: Track configuration changes over time
2. **Environment Specific**: Use different configs for dev/staging/prod
3. **Feature Flags**: Use feature flags to enable/disable payment methods
4. **Monitoring**: Track form completion rates and error frequencies

## Troubleshooting

### Common Issues

1. **Missing Required Fields**: Check `requiredFields` array for selected payment methods
2. **Validation Errors**: Verify field paths and validation patterns
3. **Field Dependencies**: Ensure dependency logic doesn't create circular references
4. **Country Overrides**: Check that country-specific rules are properly applied

### Debugging

Enable debug mode to see configuration resolution:

```typescript
const config = {
  ...customConfig,
  debug: true, // Shows field requirement resolution in console
};
```

## Future Enhancements

### Planned Features

1. **Dynamic Loading**: Load payment method configs from external sources
2. **A/B Testing**: Support for configuration experiments
3. **Machine Learning**: Intelligent field suggestion based on usage patterns
4. **Workflow Integration**: Integration with workflow engines for complex approval processes

### Extensibility

The configuration system is designed to be extended:

1. **Custom Payment Methods**: Add new payment types with custom validation
2. **Plugin Architecture**: Support for third-party validation plugins
3. **External Integrations**: Connect to external validation services
4. **Custom Field Types**: Support for specialized field types (date pickers, file uploads, etc.)

## Support

For additional support with configuration:

1. Check the comprehensive Storybook examples
2. Review the TypeScript type definitions
3. Refer to the validation scenario stories
4. Contact the development team for custom requirements
