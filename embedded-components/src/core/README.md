# Core Components Organization

This directory contains the main embedded banking components organized by functionality and importance.

## 📁 Directory Structure

### **Core Components** (Primary Business Logic)

These are the main 6 components that provide core embedded banking functionality:

- **`Accounts/`** - Account management and display
- **`Recipients/`** - Payment recipient management
- **`MakePayment/`** - Payment processing and forms
- **`TransactionsDisplay/`** - Transaction history and display
- **`OnboardingFlow/`** - Customer onboarding process
- **`LinkedAccountWidget/`** - External account linking

### **Utility Components** (Supporting Infrastructure)

These provide supporting functionality and infrastructure:

- **`EBComponentsProvider/`** - Main provider component
- **`themes.ts`** - Centralized theme configurations

### **Legacy Components** (Deprecated/Historical)

These are older components maintained for reference:

- **`OnboardingWizardBasic/`** - Legacy onboarding wizard (deprecated)

## 🏷️ Storybook Tags Strategy

### **Core Tags**

- **`@core`** - All core business components
- **`@utility`** - Supporting infrastructure components
- **`@legacy`** - Deprecated/historical components

### **Component-Specific Tags**

- **`@accounts`** - Account-related components
- **`@recipients`** - Recipient management
- **`@payment`** - Payment processing
- **`@transactions`** - Transaction display
- **`@onboarding`** - Onboarding flows
- **`@linked-accounts`** - External account linking

### **Feature Tags**

- **`@sellsense`** - SellSense themed stories
- **`@theme`** - Theme-related stories

## 📖 Story Organization

### **Core Component Stories**

```
Core/Accounts
Core/Recipients
Core/MakePayment
Core/TransactionsDisplay
Core/OnboardingFlow
Core/LinkedAccountWidget
```

### **Legacy Component Stories**

```
Legacy/OnboardingWizardBasic
Legacy/OnboardingWizardBasic/Steps
Legacy/OnboardingWizardBasic/ErrorStates
Legacy/OnboardingWizardBasic/ContentTokens
Legacy/OnboardingWizardBasic/ClientVariants
Legacy/OnboardingWizardBasic/ApiStates
```

### **Sub-Stories**

```
Core/Recipients/Validation
Core/Recipients/Configuration
Core/OnboardingFlow/Mocks
Core/OnboardingFlow/DocumentUpload
```

## 🎨 Theme Integration

All core components support SellSense theming through the centralized `themes.ts` file:

```typescript
import { SELLSENSE_THEME } from '@storybook-themes';

// In story args
theme: SELLSENSE_THEME;
```

The theme types are derived from `EBComponentsProvider/config.types.ts` and use the `EBTheme` interface.

## 🔍 Navigation Tips

### **Find Core Components**

- Use `@core` tag to see all main business components
- Use specific component tags (e.g., `@accounts`) for focused views

### **Find Themed Stories**

- Use `@sellsense` tag to see all SellSense themed stories
- Use `@theme` tag for theme-related stories

### **Find Legacy Components**

- Use `@legacy` tag for deprecated/historical components

## 📝 Adding New Components

### **For Core Components:**

1. Create directory under `src/core/`
2. Add `@core` tag to story meta
3. Add component-specific tag (e.g., `@newcomponent`)
4. Follow existing naming conventions

### **For Legacy Components:**

1. Create directory under `src/core/`
2. Add `@legacy` tag to story meta
3. Add appropriate feature tags
4. Mark as deprecated in documentation

### **For New Themes:**

1. Add theme to `themes.ts`
2. Add `@theme` tag to themed stories
3. Add brand-specific tag if needed (e.g., `@sellsense`)
