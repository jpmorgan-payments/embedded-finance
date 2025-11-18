# Embedded Finance Component Patterns

This document catalogues the most prominent UI/UX patterns extracted from the embedded-components codebase. These patterns complement the [Salt Design System patterns](https://www.saltdesignsystem.com/salt/patterns) and follow [Atomic Design principles](https://atomicdesign.bradfrost.com/chapter-2/) and [Nielsen's Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Pattern Organization

Patterns are organized by Atomic Design hierarchy:

- **Atoms**: Basic building blocks (buttons, inputs, badges)
- **Molecules**: Simple component groups (form fields, status indicators)
- **Organisms**: Complex UI sections (data tables, forms, wizards)
- **Templates**: Layout structures (responsive containers, dialog layouts)
- **Pages**: Complete user flows (onboarding, payment processing)

Each pattern includes:

- **Description**: What the pattern solves
- **Implementation**: Where it's used in the codebase
- **Refinement Status**: Notes on where the pattern needs improvement
- **Best Practices**: Alignment with usability heuristics

---

## Atoms

### Sensitive Data Masking & Toggle

**Description**: Pattern for displaying sensitive financial information (account numbers, routing numbers) with masking and reveal functionality.

**Implementation**:

- **Primary**: `Accounts/Accounts.tsx` (lines 218-360)
- **Status**: ✅ Well-implemented with copy functionality

**Pattern Details**:

```typescript
// Masking pattern
const maskedAccountNumber = account.paymentRoutingInformation?.accountNumber
  ? account.paymentRoutingInformation.accountNumber.replace(/.(?=.{4})/g, '*')
  : 'N/A';

// Toggle visibility
const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
```

**Features**:

- Last 4 digits visible by default
- Eye icon toggle to reveal/hide full information
- Copy-to-clipboard functionality
- ARIA labels for accessibility

**Refinement Needed**:

- ⚠️ **Recipients**: Should implement similar masking for account numbers in recipient cards
- ⚠️ **TransactionsDisplay**: Could benefit from masked account references

**Usability Alignment**:

- ✅ **Security & Privacy**: Sensitive data protected by default
- ✅ **User Control**: Users can reveal when needed
- ✅ **Error Prevention**: Reduces accidental exposure

---

### Status Badge System

**Description**: Consistent status indicators using badge components with semantic colors and text formatting.

**Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (lines 85-91, 137-144)
- **Secondary**: `LinkedAccountWidget/components/StatusBadge/`
- **Status**: ✅ Well-implemented with variant mapping

**Pattern Details**:

```typescript
const StatusBadge: React.FC<{ status: RecipientStatus }> = ({ status }) => {
  return (
    <Badge variant="secondary" className="eb-text-xs">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};
```

**Features**:

- Consistent badge variants across components
- Status-to-variant mapping in constants
- Human-readable text formatting (underscore to space)
- Responsive sizing

**Refinement Needed**:

- ⚠️ **Accounts**: Could use status badges for account states
- ⚠️ **TransactionsDisplay**: Status badges for transaction states need consistency

**Usability Alignment**:

- ✅ **Visibility of System Status**: Clear status communication
- ✅ **Consistency**: Uniform status representation

---

## Molecules

### Progressive Form Validation

**Description**: Multi-stage form validation with real-time feedback, conditional field requirements, and schema-driven validation.

**Implementation**:

- **Primary**: `MakePayment/hooks/usePaymentForm.ts`
- **Secondary**: `Recipients/components/RecipientForm/RecipientForm.tsx`
- **Advanced**: `OnboardingFlow/utils/formUtils.ts`
- **Status**: ✅ Well-implemented with Zod schemas

**Pattern Details**:

```typescript
// Schema-driven validation
const dynamicSchema = createDynamicRecipientFormSchema(formConfig);

// Conditional validation
const addressRequired = isAddressRequired(
  formConfig,
  watchedPaymentMethods
);

// Progressive error display
mode: 'onSubmit', // Validate on submit
reValidateMode: 'onChange', // Re-validate on change after first submit
```

**Features**:

- Configuration-driven validation rules
- Conditional field requirements based on payment methods
- Real-time validation after first submit
- API error mapping to form fields
- Zod schema superset of OAS validation

**Refinement Needed**:

- ⚠️ **OnboardingFlow**: Some forms could benefit from more granular validation feedback
- ⚠️ **MakePayment**: Manual recipient mode validation could be more progressive

**Usability Alignment**:

- ✅ **Error Prevention**: Validates before submission
- ✅ **User Control**: Clear validation feedback
- ✅ **Help & Documentation**: Inline error messages

---

### Loading State Skeletons

**Description**: Skeleton loading states that match the final content structure, providing better perceived performance.

**Implementation**:

- **Primary**: `Accounts/Accounts.tsx` (lines 87-109)
- **Secondary**: `Recipients/Recipients.tsx` (lines 403-420)
- **Tertiary**: `LinkedAccountWidget/components/LinkedAccountCardSkeleton/`
- **Status**: ✅ Well-implemented with structure matching

**Pattern Details**:

```typescript
// Skeleton matching content structure
<div className="eb-space-y-4">
  {[...Array(2)].map((_, i) => (
    <div key={i} className="eb-w-full">
      <Skeleton className="eb-h-6 eb-w-1/3" />
      <Skeleton className="eb-mb-2 eb-h-4 eb-w-1/2" />
      <Skeleton className="eb-h-4 eb-w-1/4" />
    </div>
  ))}
</div>
```

**Features**:

- Structure matches final content layout
- Appropriate number of skeleton items
- Skeleton components for complex cards
- Smooth transition to actual content

**Refinement Needed**:

- ⚠️ **TransactionsDisplay**: Could use skeleton cards for mobile view
- ⚠️ **OnboardingFlow**: Some screens lack skeleton states

**Usability Alignment**:

- ✅ **Visibility of System Status**: Users know content is loading
- ✅ **Aesthetic & Minimalist Design**: Clean loading experience

---

### Error State with Retry

**Description**: Consistent error handling with actionable retry mechanisms and contextual error messages.

**Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (lines 423-443)
- **Secondary**: `LinkedAccountWidget/LinkedAccountWidget.tsx` (lines 117-128)
- **Advanced**: `components/ServerErrorAlert/`
- **Status**: ✅ Well-implemented with retry actions

**Pattern Details**:

```typescript
// Error state with retry
if (isError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="eb-h-4 eb-w-4" />
      <AlertDescription>
        Failed to load recipients. Please try again.
        <Button variant="link" onClick={() => refetch()}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

**Features**:

- Clear error messaging
- Inline retry action
- Status-specific error messages
- ServerErrorAlert component for API errors
- Error details in development mode

**Refinement Needed**:

- ⚠️ **Accounts**: Error state could be more detailed
- ⚠️ **TransactionsDisplay**: Error handling could include more context

**Usability Alignment**:

- ✅ **Error Recovery**: Easy retry mechanism
- ✅ **Help & Documentation**: Clear error messages
- ✅ **User Control**: Users can recover from errors

---

### Empty State Pattern

**Description**: Helpful empty states that guide users on next actions when no data is available.

**Implementation**:

- **Primary**: `LinkedAccountWidget/components/EmptyState/`
- **Secondary**: `Recipients/Recipients.tsx` (lines 577-585, 633-636)
- **Tertiary**: `TransactionsDisplay/TransactionsDisplay.tsx` (lines 193-196)
- **Status**: ✅ Well-implemented with actionable guidance

**Pattern Details**:

```typescript
// Empty state with action
{isSuccess && linkedAccounts.length === 0 && (
  <EmptyState className="eb-animate-fade-in" />
)}

// Table empty state
{filteredRecipients.length === 0 ? (
  <TableRow>
    <TableCell colSpan={4} className="eb-py-8 eb-text-center eb-text-gray-500">
      No recipients found
    </TableCell>
  </TableRow>
) : (
  // ... data rows
)}
```

**Features**:

- Contextual messaging
- Call-to-action when appropriate
- Consistent styling
- Animation for smooth appearance
- Search/filter feedback when empty

**Refinement Needed**:

- ⚠️ **Accounts**: Empty state could suggest creating accounts
- ⚠️ **TransactionsDisplay**: Empty state could be more informative

**Usability Alignment**:

- ✅ **Visibility of System Status**: Clear indication of empty state
- ✅ **Help & Documentation**: Guidance on next steps

---

## Organisms

### Responsive Data Table with Mobile Cards

**Description**: Data tables that adapt to mobile screens by transforming into card layouts, maintaining functionality across devices.

**Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (lines 564-890)
- **Secondary**: `TransactionsDisplay/TransactionsDisplay.tsx` (lines 29-90, 181-192)
- **Status**: ✅ Well-implemented with container queries

**Pattern Details**:

```typescript
// Responsive layout detection
const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();
const isMobile = containerWidth > 0 && containerWidth < 640;
const isTablet = containerWidth >= 640 && containerWidth < 1024;

// Conditional rendering
{shouldUseMobileLayout ? (
  <div>
    {filteredRecipients.map((recipient) => (
      <RecipientCard key={recipient.id} recipient={recipient} />
    ))}
  </div>
) : (
  <Table>
    {/* Desktop table */}
  </Table>
)}
```

**Features**:

- Container query-based responsive detection
- Mobile card component with key information
- Tablet-optimized table layout
- Desktop full-featured table
- Consistent actions across layouts
- Widget mode for embedded contexts

**Refinement Needed**:

- ⚠️ **TransactionsDisplay**: Mobile cards could include more transaction details
- ⚠️ **Accounts**: Could benefit from responsive card/table pattern

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Optimized for each device type
- ✅ **Aesthetic & Minimalist Design**: Clean adaptation
- ✅ **Recognition Rather Than Recall**: Consistent information across layouts

---

### Dialog/Modal Form Pattern

**Description**: Forms presented in modal dialogs with scrollable content, proper focus management, and state preservation.

**Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (lines 454-480, 923-970)
- **Secondary**: `MakePayment/MakePayment.tsx` (lines 271-476)
- **Tertiary**: `LinkedAccountWidget/components/LinkedAccountFormDialog/`
- **Status**: ✅ Well-implemented with scrollable dialogs

**Pattern Details**:

```typescript
// Dialog with scrollable content
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent className="eb-scrollable-dialog eb-max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create New Recipient</DialogTitle>
    </DialogHeader>
    <div className="eb-scrollable-content">
      <RecipientForm mode="create" onSubmit={handleCreateRecipient} />
    </div>
  </DialogContent>
</Dialog>
```

**Features**:

- Scrollable dialog content for long forms
- Proper dialog state management
- Form state reset on close
- Responsive dialog sizing
- Focus trap and keyboard navigation
- Success state handling

**Refinement Needed**:

- ⚠️ **MakePayment**: Dialog could better handle very long forms
- ⚠️ **OnboardingFlow**: Some dialogs could use better mobile optimization

**Usability Alignment**:

- ✅ **User Control**: Easy to open/close
- ✅ **Error Prevention**: Form validation before submission
- ✅ **Flexibility & Efficiency**: Quick access without navigation

---

### Filter & Search Pattern

**Description**: Combined search and filter controls with real-time filtering, clear filters action, and filter state persistence.

**Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (lines 486-561)
- **Status**: ✅ Well-implemented with multiple filter types

**Pattern Details**:

```typescript
// Search and filter state
const [searchTerm, setSearchTerm] = useState('');
const { filters, updateFilter, clearFilters } = useRecipientsFilters();

// Filtered results
const filteredRecipients = useMemo(() => {
  return recipientsData.recipients.filter((recipient) => {
    const matchesSearch =
      searchTerm === '' ||
      formatRecipientName(recipient)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      !filters.status || recipient.status === filters.status;
    return matchesSearch && matchesStatus;
  });
}, [recipientsData?.recipients, searchTerm, filters.status]);
```

**Features**:

- Real-time search filtering
- Multiple filter types (status, type)
- Clear filters action
- Search icon in input
- Filter persistence during session
- Widget mode hides filters

**Refinement Needed**:

- ⚠️ **TransactionsDisplay**: Could benefit from search and filter functionality
- ⚠️ **Accounts**: Could add filtering by account category

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Quick data filtering
- ✅ **User Control**: Easy to clear and modify filters
- ✅ **Recognition Rather Than Recall**: Visible filter state

---

### Review Panel Pattern

**Description**: Side-by-side review panel that shows form summary and updates in real-time as user fills the form.

**Implementation**:

- **Primary**: `MakePayment/components/ReviewPanel/`
- **Status**: ✅ Well-implemented with real-time updates

**Pattern Details**:

```typescript
// Two-column layout with review panel
<div className={`eb-grid eb-grid-cols-1 eb-gap-4 ${showPreviewPanel ? 'md:eb-grid-cols-2' : ''}`}>
  <div className="eb-space-y-6">
    {/* Form fields */}
  </div>
  {showPreviewPanel && (
    <div className="eb-order-last md:eb-order-none">
      <ReviewPanel
        filteredRecipients={paymentData.filteredRecipients}
        accounts={paymentData.accounts}
      />
    </div>
  )}
</div>
```

**Features**:

- Real-time form summary
- Responsive layout (stacks on mobile)
- Key information display
- Fee calculation preview
- Account balance display
- Conditional rendering based on prop

**Refinement Needed**:

- ⚠️ **OnboardingFlow**: Could benefit from review panels in stepper flows
- ⚠️ **Recipients**: Edit form could show review panel

**Usability Alignment**:

- ✅ **Visibility of System Status**: Users see what they're submitting
- ✅ **Error Prevention**: Review before final submission
- ✅ **Recognition Rather Than Recall**: Summary visible at all times

---

### Wizard/Stepper Flow Pattern

**Description**: Multi-step wizard with progress tracking, step validation, conditional navigation, and state persistence.

**Implementation**:

- **Primary**: `OnboardingFlow/OnboardingFlow.tsx`
- **Secondary**: `OnboardingFlow/components/StepperRenderer/`
- **Status**: ✅ Well-implemented with complex flow logic

**Pattern Details**:

```typescript
// Flow configuration
const flowConfig = {
  screens: [
    { id: 'gateway', type: 'component', Component: GatewayScreen },
    { id: 'organization', type: 'stepper', stepperConfig: {...} },
    // ...
  ]
};

// Flow context with navigation
const { currentScreenId, goTo, sessionData, updateSessionData } = useFlowContext();

// Progress tracking
const { sectionStatuses, stepValidations } = getFlowProgress(
  sections, sessionData, clientData, savedFormValues, currentScreenId
);
```

**Features**:

- Configuration-driven flow
- Step validation before progression
- Progress tracking and status
- Conditional step visibility
- Form state persistence
- Back/forward navigation
- Sidebar timeline (optional)
- Mobile-optimized stepper

**Refinement Needed**:

- ⚠️ **MakePayment**: Could use stepper pattern for complex payment flows
- ⚠️ **LinkedAccountWidget**: Microdeposit verification could be a stepper

**Usability Alignment**:

- ✅ **Visibility of System Status**: Clear progress indication
- ✅ **Error Prevention**: Validation before progression
- ✅ **User Control**: Can navigate back and forth
- ✅ **Flexibility & Efficiency**: Can skip completed steps

---

### Timeline/Progress Indicator Pattern

**Description**: Visual timeline showing onboarding progress with clickable sections, step status, and completion tracking.

**Implementation**:

- **Primary**: `OnboardingFlow/components/OnboardingTimeline/`
- **Status**: ✅ Well-implemented with interactive timeline

**Pattern Details**:

```typescript
// Timeline with sections and steps
<OnboardingTimeline
  sections={[
    {
      id: 'gateway',
      title: 'Business Type',
      status: organizationType ? 'completed' : 'not_started',
      steps: [],
    },
    ...sections.map((section) => ({
      ...section,
      status: sectionStatuses[section.id] || 'not_started',
      steps: section.stepperConfig?.steps.map((step) => ({
        ...step,
        status: stepValidations[section.id][step.id].isValid
          ? 'completed' : 'not_started',
      })),
    })),
  ]}
  onSectionClick={(screenId) => goTo(screenId)}
  onStepClick={(sectionId, stepId) => currentStepperGoTo(stepId)}
/>
```

**Features**:

- Visual progress representation
- Clickable sections and steps
- Status indicators (completed, not_started, on_hold)
- Conditional navigation (only to valid steps)
- Mobile-responsive sidebar
- Disabled state during form submission

**Refinement Needed**:

- ⚠️ **MakePayment**: Could show payment flow progress
- ⚠️ **LinkedAccountWidget**: Could show account linking progress

**Usability Alignment**:

- ✅ **Visibility of System Status**: Clear progress visualization
- ✅ **User Control**: Can navigate to any completed step
- ✅ **Recognition Rather Than Recall**: Visual progress memory

---

## Templates

### Container Query Responsive Layout

**Description**: Responsive layouts using container queries instead of viewport queries, allowing components to adapt to their container size.

**Implementation**:

- **Primary**: `LinkedAccountWidget/LinkedAccountWidget.tsx` (lines 68-161)
- **Secondary**: `LinkedAccountWidget/LinkedAccountWidget.constants.ts`
- **Status**: ✅ Well-implemented with container queries

**Pattern Details**:

```typescript
// Container query breakpoints
export const CONTAINER_BREAKPOINTS = {
  md: '28rem', // 448px - Mobile to tablet
  '2xl': '56rem', // 896px - Tablet to desktop
} as const;

// Container query classes
<div className="eb-w-full eb-@container">
  <Card className="eb-mx-auto eb-w-full eb-max-w-5xl">
    <CardHeader className="@md:eb-p-3 @lg:eb-p-4">
      {/* Responsive to container, not viewport */}
    </CardHeader>
  </Card>
</div>
```

**Features**:

- Container-based breakpoints
- Independent of viewport size
- Works in embedded contexts
- Responsive grid layouts
- Adaptive typography and spacing

**Refinement Needed**:

- ⚠️ **Recipients**: Could benefit from container queries for widget mode
- ⚠️ **Accounts**: Could use container queries for card layouts

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Adapts to any container
- ✅ **Aesthetic & Minimalist Design**: Clean responsive behavior

---

### Ref-based Component Control Pattern

**Description**: Exposing component methods to parent components via refs for programmatic control (refresh, reset, export).

**Implementation**:

- **Primary**: `Accounts/Accounts.tsx` (lines 28-85)
- **Secondary**: `TransactionsDisplay/TransactionsDisplay.tsx` (lines 21-145)
- **Status**: ✅ Well-implemented with useImperativeHandle

**Pattern Details**:

```typescript
// Ref interface
export interface AccountsRef {
  refresh: () => void;
  // exportAccounts: () => void;
  // getAccountsData: () => AccountResponse[];
}

// Component with ref
export const Accounts = forwardRef<AccountsRef, AccountsProps>(
  ({ allowedCategories, clientId, title }, ref) => {
    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => {
          refetch();
          Object.values(accountCardRefs.current).forEach((cardRef) => {
            cardRef?.refreshBalance();
          });
        },
      }),
      [refetch]
    );
  }
);
```

**Features**:

- Type-safe ref interfaces
- Multiple exposed methods
- Nested ref forwarding
- Refresh cascading to child components
- Future extensibility (commented methods)

**Refinement Needed**:

- ⚠️ **Recipients**: Could expose refresh and filter methods via ref
- ⚠️ **LinkedAccountWidget**: Could expose refresh method

**Usability Alignment**:

- ✅ **User Control**: Programmatic component control
- ✅ **Flexibility & Efficiency**: External refresh capability

---

### Configuration-Driven Forms Pattern

**Description**: Forms that adapt their fields, validation, and behavior based on configuration objects, enabling dynamic form generation.

**Implementation**:

- **Primary**: `Recipients/components/RecipientForm/RecipientForm.tsx`
- **Secondary**: `Recipients/types/paymentConfig.ts`
- **Status**: ✅ Well-implemented with dynamic schemas

**Pattern Details**:

```typescript
// Configuration object
const resolvedConfig = createRecipientsConfig(config);

// Dynamic schema generation
const dynamicSchema = createDynamicRecipientFormSchema(formConfig);

// Conditional field requirements
const addressRequired = isAddressRequired(formConfig, watchedPaymentMethods);

// Configuration-driven validation
const requiredContactTypes = getRequiredContactTypes(
  formConfig,
  paymentMethods
);
```

**Features**:

- Runtime form configuration
- Dynamic schema generation
- Conditional field requirements
- Payment method-specific validation
- Configurable field visibility
- Default config fallback

**Refinement Needed**:

- ⚠️ **MakePayment**: Could benefit from more configuration options
- ⚠️ **OnboardingFlow**: Some forms could be more configuration-driven

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Adapts to different use cases
- ✅ **Error Prevention**: Configuration-driven validation

---

## Pages

### Multi-Mode Form Pattern

**Description**: Forms that support multiple input modes (existing selection vs. manual entry) with conditional field rendering.

**Implementation**:

- **Primary**: `MakePayment/MakePayment.tsx` (lines 336-376)
- **Status**: ✅ Well-implemented with mode toggle

**Pattern Details**:

```typescript
// Mode toggle
<RecipientModeToggle />

// Conditional rendering based on mode
{form.watch('recipientMode') !== 'manual' ? (
  <>
    <RecipientSelector />
    <RecipientDetails />
  </>
) : (
  <>
    <PaymentMethodSelector />
    <ManualRecipientFields />
  </>
)}
```

**Features**:

- Toggle between modes
- Different field sets per mode
- Mode-specific validation
- Consistent form structure
- Mode persistence during session

**Refinement Needed**:

- ⚠️ **Recipients**: Could support manual entry mode
- ⚠️ **LinkedAccountWidget**: Could have manual account entry mode

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Multiple input methods
- ✅ **User Control**: Choose preferred input method
- ✅ **Error Prevention**: Mode-specific validation

---

### Success State Pattern

**Description**: Dedicated success screens after form submission with next action options and form reset capability.

**Implementation**:

- **Primary**: `MakePayment/components/PaymentSuccess/`
- **Status**: ✅ Well-implemented with action options

**Pattern Details**:

```typescript
// Success state rendering
{localSuccess ? (
  <PaymentSuccess
    onMakeAnotherPayment={handleMakeAnotherPayment}
    filteredRecipients={paymentData.filteredRecipients}
    accounts={paymentData.accounts}
    formData={form.getValues()}
  />
) : (
  <FormProvider {...form}>
    {/* Form content */}
  </FormProvider>
)}
```

**Features**:

- Clear success messaging
- Transaction summary display
- "Make Another" action
- Form reset on success
- Success state persistence
- Optional callback on success

**Refinement Needed**:

- ⚠️ **Recipients**: Create/edit success could be more prominent
- ⚠️ **LinkedAccountWidget**: Success state for account linking

**Usability Alignment**:

- ✅ **Visibility of System Status**: Clear success confirmation
- ✅ **User Control**: Can make another or close
- ✅ **Error Recovery**: Clear next steps

---

## Cross-Cutting Patterns

### Interceptor Status Pattern

**Description**: Pattern for waiting until API interceptors are ready before making requests, preventing race conditions.

**Implementation**:

- **Primary**: `EBComponentsProvider/EBComponentsProvider.tsx` (lines 29-34, 88)
- **Usage**: All components using `useInterceptorStatus()`
- **Status**: ✅ Well-implemented across all components

**Pattern Details**:

```typescript
// Interceptor context
const InterceptorContext = createContext<{
  interceptorReady: boolean;
}>({ interceptorReady: false });

// Usage in components
const { interceptorReady } = useInterceptorStatus();
const { data } = useGetAccounts(undefined, {
  query: {
    enabled: interceptorReady,
  },
});
```

**Features**:

- Prevents premature API calls
- Centralized interceptor state
- React Query integration
- Automatic retry when ready

**Refinement Needed**:

- ✅ All components properly implement this pattern

**Usability Alignment**:

- ✅ **Error Prevention**: Prevents failed requests
- ✅ **Visibility of System Status**: Components wait for readiness

---

### Pagination Pattern

**Description**: Server-side pagination with page size controls, navigation buttons, and result count display.

**Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (lines 247-248, 891-920)
- **Status**: ✅ Well-implemented with server-side pagination

**Pattern Details**:

```typescript
// Pagination state
const [currentPage, setCurrentPage] = useState(1);
const [pageSize] = useState(10);

// API call with pagination
useGetAllRecipients({
  clientId,
  page: currentPage,
  limit: pageSize,
});

// Pagination controls
{recipientsData && recipientsData.total_items > pageSize && (
  <div className="eb-mt-4 eb-flex eb-items-center eb-justify-between">
    <div className="eb-text-sm eb-text-gray-600">
      Showing {(currentPage - 1) * pageSize + 1} to{' '}
      {Math.min(currentPage * pageSize, recipientsData.total_items)}{' '}
      of {recipientsData.total_items} recipients
    </div>
    <div className="eb-flex eb-gap-2">
      <Button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
        Previous
      </Button>
      <Button disabled={currentPage * pageSize >= recipientsData.total_items}
        onClick={() => setCurrentPage(currentPage + 1)}>
        Next
      </Button>
    </div>
  </div>
)}
```

**Features**:

- Server-side pagination
- Result count display
- Previous/Next navigation
- Disabled state for boundaries
- Page size configuration

**Refinement Needed**:

- ⚠️ **TransactionsDisplay**: Could benefit from pagination
- ⚠️ **Accounts**: Could paginate if many accounts

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Efficient data loading
- ✅ **Visibility of System Status**: Clear pagination state

---

## Technical Patterns

### OAS-Driven Type-Safe API Integration

**Description**: Pattern for generating type-safe React Query hooks and TypeScript types from OpenAPI Specifications (OAS) using Orval, ensuring compile-time type safety and API contract compliance.

**Implementation**:

- **Primary**: All components using generated hooks from `@/api/generated/ep-*`
- **Code Generation**: Orval configuration generating hooks from OAS files
- **Status**: ✅ Well-implemented across all components

**Pattern Details**:

```typescript
// Generated hooks from OAS
import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
// Generated types ensure type safety
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import {
  useAmendRecipient,
  useCreateRecipient,
  useGetAllRecipients,
} from '@/api/generated/ep-recipients';
import type {
  Recipient,
  RecipientRequest,
} from '@/api/generated/ep-recipients.schemas';

// Type-safe usage
const { data, isLoading, isError, refetch } = useGetAccounts(
  clientId ? { clientId } : undefined,
  {
    query: {
      enabled: interceptorReady,
    },
  }
);
```

**Features**:

- Automatic code generation from OAS
- Type-safe API calls at compile time
- React Query hooks pre-configured
- Type definitions for all API contracts
- Consistent error types
- Pagination types generated
- Request/response type safety

**Refinement Needed**:

- ✅ All components properly use generated hooks
- ⚠️ Some components could benefit from more generated utility types

**Technical Benefits**:

- ✅ **Type Safety**: Compile-time validation of API contracts
- ✅ **Maintainability**: Single source of truth (OAS)
- ✅ **Consistency**: Standardized API interaction patterns
- ✅ **Developer Experience**: Auto-completion and type checking

---

### API Error Mapping Pattern

**Description**: Pattern for mapping API error responses to form field errors and user-friendly error messages, with support for field-level and global error handling.

**Implementation**:

- **Primary**: `OnboardingFlow/utils/formUtils.ts` (lines 133-228)
- **Secondary**: `components/ServerErrorAlert/`
- **Status**: ✅ Well-implemented with field-level mapping

**Pattern Details**:

```typescript
// API error to form error mapping
export function mapPartyApiErrorsToFormErrors(
  errors: ApiErrorReasonV2[]
): FormError[] {
  return errors.map((error) => ({
    field: error.field as keyof OnboardingFormValuesSubmit,
    message: error.message,
    path: error.path,
  }));
}

// Setting form errors from API response
export function setApiFormErrors(
  form: UseFormReturn<any, any, any>,
  apiFormErrors: FormError[]
) {
  apiFormErrors.forEach((error) => {
    if (error.field) {
      form.setError(error.field as any, {
        type: 'server',
        message: error.message,
      });
    }
  });
}

// Usage in components
const { mutate: createRecipient } = useCreateRecipient({
  mutation: {
    onError: (error) => {
      const formErrors = mapApiErrorsToFormErrors(error);
      setApiFormErrors(form, formErrors);
    },
  },
});
```

**Features**:

- Field-level error mapping
- Global error handling
- ServerErrorAlert component for API errors
- Status code-specific error messages
- Development mode error details
- User-friendly error messages

**Refinement Needed**:

- ⚠️ **MakePayment**: Could benefit from more granular error mapping
- ⚠️ **Recipients**: Some error scenarios could be more specific

**Technical Benefits**:

- ✅ **Error Recovery**: Clear error communication to users
- ✅ **Developer Experience**: Structured error handling
- ✅ **Maintainability**: Centralized error mapping logic

---

### Custom Hooks Pattern for Business Logic

**Description**: Pattern for extracting complex business logic into reusable custom hooks, separating concerns and improving testability.

**Implementation**:

- **Primary**: `MakePayment/hooks/` (usePaymentForm, usePaymentData, usePaymentValidation)
- **Secondary**: `Recipients/hooks/useRecipientsFilters.ts`
- **Tertiary**: `LinkedAccountWidget/hooks/useLinkedAccounts.ts`
- **Status**: ✅ Well-implemented with clear separation of concerns

**Pattern Details**:

```typescript
// Custom hook for payment data aggregation
export const usePaymentData = (
  paymentMethods: PaymentMethod[],
  form: UseFormReturn<PaymentFormData>
) => {
  const { interceptorReady } = useInterceptorStatus();

  // Multiple API calls
  const { data: accounts } = useGetAccounts(undefined, {
    query: { enabled: interceptorReady },
  });

  const { data: recipients } = useGetAllRecipients(undefined, {
    query: { enabled: interceptorReady },
  });

  // Derived state
  const selectedAccount = useMemo(() => {
    const accountId = form.watch('from');
    return accounts?.items.find((a) => a.id === accountId);
  }, [accounts, form.watch('from')]);

  // Filtered data
  const filteredRecipients = useMemo(() => {
    if (!recipients?.recipients || !selectedAccount) return [];
    return filterRecipientsByAccount(recipients.recipients, selectedAccount);
  }, [recipients, selectedAccount]);

  return {
    accounts,
    recipients,
    selectedAccount,
    filteredRecipients,
    // ... other derived values
  };
};

// Usage in component
const paymentData = usePaymentData(paymentMethods, form);
```

**Features**:

- Business logic encapsulation
- Reusable across components
- Testable in isolation
- Clear dependency management
- Memoized derived state
- React Query integration

**Refinement Needed**:

- ⚠️ **OnboardingFlow**: Some logic could be extracted to custom hooks
- ⚠️ **Accounts**: Balance fetching logic could be a custom hook

**Technical Benefits**:

- ✅ **Separation of Concerns**: Logic separated from UI
- ✅ **Reusability**: Hooks can be shared across components
- ✅ **Testability**: Business logic tested independently
- ✅ **Maintainability**: Easier to update and debug

---

### Context Provider Pattern for Shared State

**Description**: Pattern for managing shared application state and configuration through React Context providers, enabling component composition and prop drilling avoidance.

**Implementation**:

- **Primary**: `EBComponentsProvider/EBComponentsProvider.tsx`
- **Secondary**: `OnboardingFlow/contexts/FlowContext.tsx`
- **Tertiary**: `OnboardingFlow/contexts/OnboardingContext.tsx`
- **Status**: ✅ Well-implemented with multiple context layers

**Pattern Details**:

```typescript
// Provider with multiple concerns
export const EBComponentsProvider: React.FC<PropsWithChildren<EBConfig>> = ({
  children,
  apiBaseUrl,
  headers = {},
  theme = {},
  contentTokens = {},
}) => {
  const [interceptorReady, setInterceptorReady] = useState(false);

  // i18n instance creation
  const i18nInstance = useMemo(
    () => createI18nInstance(contentTokens),
    [contentTokens?.name, JSON.stringify(contentTokens?.tokens)]
  );

  // Axios interceptor setup
  useEffect(() => {
    const interceptorId = AXIOS_INSTANCE.interceptors.request.use((config) => {
      config.baseURL = apiBaseUrl;
      config.headers = { ...config.headers, ...headers };
      return config;
    });

    setInterceptorReady(true);
    return () => {
      AXIOS_INSTANCE.interceptors.request.eject(interceptorId);
    };
  }, [apiBaseUrl, headers]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <InterceptorContext.Provider value={{ interceptorReady }}>
          <ContentTokensContext.Provider value={contentTokens}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
              {children}
            </ErrorBoundary>
          </ContentTokensContext.Provider>
        </InterceptorContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// Usage in components
const { interceptorReady } = useInterceptorStatus();
const contentTokens = useContext(ContentTokensContext);
```

**Features**:

- Multiple context layers
- Provider composition
- Error boundary integration
- Interceptor state management
- i18n instance scoping
- Theme configuration
- Content token management

**Refinement Needed**:

- ✅ Well-structured with clear separation
- ⚠️ Some contexts could benefit from reducer pattern for complex state

**Technical Benefits**:

- ✅ **State Management**: Centralized configuration
- ✅ **Composition**: Multiple providers compose cleanly
- ✅ **Type Safety**: TypeScript interfaces for context values
- ✅ **Performance**: Memoized context values prevent unnecessary re-renders

---

## Pattern Refinement Matrix

| Pattern                    | Accounts | Recipients | MakePayment | TransactionsDisplay | OnboardingFlow | LinkedAccountWidget |
| -------------------------- | -------- | ---------- | ----------- | ------------------- | -------------- | ------------------- |
| **Sensitive Data Masking** | ✅       | ⚠️ Needs   | -           | ⚠️ Needs            | -              | -                   |
| **Status Badges**          | ⚠️ Needs | ✅         | -           | ⚠️ Needs            | -              | ✅                  |
| **Progressive Validation** | -        | ✅         | ✅          | -                   | ⚠️ Partial     | -                   |
| **Loading Skeletons**      | ✅       | ✅         | -           | ⚠️ Needs            | ⚠️ Partial     | ✅                  |
| **Error with Retry**       | ⚠️ Basic | ✅         | -           | ⚠️ Basic            | ✅             | ✅                  |
| **Empty States**           | ⚠️ Basic | ✅         | -           | ⚠️ Basic            | -              | ✅                  |
| **Responsive Table/Cards** | ⚠️ Needs | ✅         | -           | ✅                  | -              | -                   |
| **Dialog Forms**           | -        | ✅         | ✅          | -                   | ⚠️ Partial     | ✅                  |
| **Filter & Search**        | ⚠️ Needs | ✅         | -           | ⚠️ Needs            | -              | -                   |
| **Review Panel**           | -        | ⚠️ Needs   | ✅          | -                   | ⚠️ Needs       | -                   |
| **Wizard/Stepper**         | -        | -          | ⚠️ Needs    | -                   | ✅             | ⚠️ Needs            |
| **Timeline/Progress**      | -        | -          | ⚠️ Needs    | -                   | ✅             | ⚠️ Needs            |
| **Container Queries**      | ⚠️ Needs | ⚠️ Needs   | -           | -                   | -              | ✅                  |
| **Ref Control**            | ✅       | ⚠️ Needs   | -           | ✅                  | -              | ⚠️ Needs            |
| **Config-Driven Forms**    | -        | ✅         | ⚠️ Needs    | -                   | ⚠️ Partial     | -                   |
| **Multi-Mode Forms**       | -        | ⚠️ Needs   | ✅          | -                   | -              | ⚠️ Needs            |
| **Success States**         | -        | ⚠️ Needs   | ✅          | -                   | -              | ⚠️ Needs            |
| **Pagination**             | ⚠️ Needs | ✅         | -           | ⚠️ Needs            | -              | -                   |

**Legend**:

- ✅ = Well-implemented
- ⚠️ Needs = Pattern exists but needs refinement/implementation
- ⚠️ Partial = Partially implemented
- ⚠️ Basic = Basic implementation, could be enhanced
- - = Not applicable

---

## Best Practices Summary

### Atomic Design Alignment

1. **Atoms**: Reusable, single-responsibility components (badges, inputs, buttons)
2. **Molecules**: Composed atoms with specific functionality (form fields, status indicators)
3. **Organisms**: Complex components combining molecules (tables, forms, wizards)
4. **Templates**: Layout structures (responsive containers, dialog layouts)
5. **Pages**: Complete user flows (onboarding, payment processing)

### Nielsen's Usability Heuristics

1. **Visibility of System Status**: Loading states, progress indicators, status badges
2. **Match Between System and Real World**: Familiar patterns (forms, tables, wizards)
3. **User Control**: Ref-based control, cancel actions, mode toggles
4. **Consistency**: Status badges, error handling, empty states
5. **Error Prevention**: Progressive validation, confirmation dialogs
6. **Recognition Rather Than Recall**: Review panels, visible filters, progress indicators
7. **Flexibility & Efficiency**: Multiple input modes, keyboard shortcuts, quick actions
8. **Aesthetic & Minimalist Design**: Clean loading states, focused forms
9. **Help Users Recognize Errors**: Clear error messages, inline validation
10. **Help & Documentation**: Tooltips, info popovers, contextual help

---

## Recommendations for Pattern Enhancement

### High Priority

1. **Standardize Status Badge System**: Create shared status badge component with consistent variants
2. **Implement Sensitive Data Masking**: Add masking pattern to Recipients and TransactionsDisplay
3. **Enhance Error States**: Improve error handling consistency across all components
4. **Add Pagination**: Implement pagination for TransactionsDisplay and Accounts when needed

### Medium Priority

1. **Container Query Migration**: Migrate Recipients and Accounts to container queries
2. **Review Panel Pattern**: Add review panels to OnboardingFlow and Recipients edit forms
3. **Success State Standardization**: Create consistent success state pattern across all forms
4. **Ref Control Enhancement**: Add ref-based control to Recipients and LinkedAccountWidget

### Low Priority

1. **Wizard Pattern Extraction**: Extract wizard pattern for reuse in MakePayment and LinkedAccountWidget
2. **Filter & Search Enhancement**: Add search/filter to TransactionsDisplay and Accounts
3. **Multi-Mode Form Pattern**: Extend multi-mode pattern to Recipients and LinkedAccountWidget
4. **Configuration-Driven Forms**: Enhance MakePayment and OnboardingFlow with more configuration options

---

## References

- [Salt Design System Patterns](https://www.saltdesignsystem.com/salt/patterns)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/)
- [Nielsen's 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

---

_Last Updated: Based on codebase analysis of embedded-components v1.0_
