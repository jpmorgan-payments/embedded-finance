# Form Automation System

This automation system provides context-aware form filling capabilities for the
SellSense demo application.

## Features

- **Context-Aware**: Automatically detects which scenario is active and provides
  appropriate automation data
- **Form Detection**: Monitors for open forms and provides real-time feedback
- **Keyboard Shortcuts**: Use `Ctrl+Shift+A` to toggle the automation panel
- **Visual Feedback**: Shows form status and element detection in real-time
- **Multiple Scenarios**: Supports different automation data for various
  scenarios

## How to Use

### 1. Access the Automation

- **Visual**: Click the floating amber button (⚡) in the bottom-right corner
- **Keyboard**: Press `Ctrl+Shift+A` to toggle the automation panel

### 2. Available Scenarios

The automation system supports the following scenarios:

- **Linked Bank Account**: Fresh start account setup for new users
- **Seller with Limited DDA**: Individual account setup with personal
  information
- **Active Seller with Direct Payouts**: Business account setup with company
  information
- **New Seller - Onboarding**: New seller setup process

### 3. Using the Automation

1. **Open a Form**: Navigate to a scenario that includes the Linked Account
   Widget
2. **Open the Form**: Click "Link an Account" to open the form dialog
3. **Activate Automation**: Click the automation button or use `Ctrl+Shift+A`
4. **Fill Form**: Click "Fill Form" to automatically populate all fields
5. **Submit**: Click "Submit" to submit the form, or "Reset" to clear it

## Supported Form Fields

The automation system can fill the following fields:

- **Account Type**: Individual or Business
- **Personal Information**: First Name, Last Name (for Individual accounts)
- **Business Information**: Business Name (for Business accounts)
- **Bank Information**: Routing Number, Account Number
- **Authorization**: Certification checkbox

## Technical Details

### Form Detection

The system uses multiple selectors to detect form elements:

```typescript
// Account type selection
'select, [role="combobox"]';

// Personal information
'input[placeholder*="first name"], input[placeholder*="First name"]';
'input[placeholder*="last name"], input[placeholder*="Last name"]';

// Business information
'input[placeholder*="business name"], input[placeholder*="Business name"]';

// Bank information
'input[placeholder*="routing number"], input[placeholder*="Routing number"]';
'input[placeholder*="account number"], input[placeholder*="Account number"]';

// Authorization
'input[type="checkbox"]';
```

### Automation Data

Each scenario has predefined data:

```typescript
{
  accountType: 'INDIVIDUAL' | 'ORGANIZATION',
  firstName?: string,
  lastName?: string,
  businessName?: string,
  routingNumber: string,
  accountNumber: string,
  certify: boolean
}
```

### Adding New Scenarios

To add automation for a new scenario:

1. Add the scenario to `AUTOMATION_SCENARIOS` in `form-automation.tsx`
2. Define the automation data with appropriate field values
3. Set the delay timing (controls typing speed)

Example:

```typescript
'New Scenario Name': {
  name: 'Scenario Display Name',
  description: 'Description of what this automation does',
  data: {
    accountType: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
    routingNumber: '021000021',
    accountNumber: '1234567890',
    certify: true,
  },
  delay: 300,
},
```

## Troubleshooting

### Form Not Detected

- Ensure the form dialog is open
- Check that the form contains the expected fields
- Verify the scenario has automation data defined

### Elements Not Found

- The automation will show which elements are found/missing
- Check the browser console for detailed error messages
- Ensure the form structure matches the expected selectors

### Automation Not Working

- Verify you're on a supported scenario
- Check that the form is fully loaded before running automation
- Try refreshing the page if elements aren't detected

## Development

### Extending the System

To add support for new form types:

1. Update `FormDetectionUtils.getFormType()` to detect the new form
2. Add form element selectors in `FormDetectionUtils.getFormElements()`
3. Create automation data for the new form type
4. Add automation logic in `FormAutomationUtils`

### Testing

The automation system includes comprehensive logging:

- Form detection status
- Element finding attempts
- Automation progress
- Error reporting

Check the browser console for detailed information during automation runs.
