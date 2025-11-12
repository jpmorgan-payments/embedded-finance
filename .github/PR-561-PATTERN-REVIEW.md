# PR #561 Pattern Review: Linked Account Updates

## Executive Summary

This PR introduces significant improvements to the Linked Accounts feature with **45 commits**, adding **6,044 lines** and removing **1,098 lines**. The changes demonstrate several reusable patterns that should be extracted into the component library's standard practices and documentation.

## Key Patterns Identified

### 1. ServerErrorAlert Component Pattern ⭐ **HIGH PRIORITY**

**Location**: `embedded-components/src/core/OnboardingFlow/components/ServerErrorAlert/ServerErrorAlert.tsx`

**Pattern Description**:
A reusable, standardized error alert component that handles API errors with customizable messages and retry actions.

**Key Features**:
- HTTP status code-based error message mapping
- Support for both string and object-based custom error messages
- Optional retry action button
- Consistent error display across components

**Implementation Pattern**:
```typescript
type ServerErrorAlertProps = {
  error: ErrorType<ApiError> | null;
  customErrorMessage?: string | Record<string, string>;
  tryAgainAction?: () => void;
  className?: string;
};

// Usage
<ServerErrorAlert
  error={apiError}
  customErrorMessage={{
    '400': 'Custom 400 message',
    '500': 'Custom 500 message',
    default: 'Default error message'
  }}
  tryAgainAction={() => refetch()}
/>
```

**Extraction Recommendation**:
- Move to `src/components/ux/ServerErrorAlert/` for broader reuse
- Add to component library exports
- Document in component guidelines
- Create Storybook stories demonstrating all variants

**Benefits**:
- Consistent error handling UX across all components
- Reduces code duplication
- Centralized error message management
- Easy to update error messaging globally

---

### 2. Loading Skeleton Pattern ⭐ **HIGH PRIORITY**

**Pattern Description**:
Consistent loading state patterns using skeleton components instead of simple "Loading..." text.

**Implementation Pattern**:
```typescript
// Loading state with skeleton
{status === 'pending' && (
  <div className="eb-space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="eb-h-12 eb-w-full" />
    ))}
  </div>
)}

// Header skeleton
<Skeleton className="eb-h-6 eb-w-32" />
<Skeleton className="eb-h-10 eb-w-28" />
```

**Extraction Recommendation**:
- Create reusable skeleton components for common patterns:
  - `CardSkeleton` - For card-based layouts
  - `ListSkeleton` - For list items
  - `HeaderSkeleton` - For page/component headers
  - `FormSkeleton` - For form loading states
- Document skeleton usage patterns in styling guidelines
- Ensure skeletons match actual content structure

**Benefits**:
- Better perceived performance
- Consistent loading UX
- Reduces layout shift
- Professional appearance

---

### 3. React Query Cache Invalidation Pattern ⭐ **HIGH PRIORITY**

**Pattern Description**:
Proper query key management and cache invalidation after mutations.

**Implementation Pattern**:
```typescript
// Using generated query keys
import { getSmbdoGetClientQueryKey } from '@/api/generated/smbdo';

// After successful mutation
onSuccess: (response) => {
  const queryKey = getSmbdoGetClientQueryKey(clientData.id);
  
  // Option 1: Optimistic update
  queryClient.setQueryData(queryKey, (oldData) => ({
    ...oldData,
    // Update specific part of cache
  }));
  
  // Option 2: Invalidate to refetch
  queryClient.invalidateQueries({ queryKey });
}
```

**Extraction Recommendation**:
- Document query key patterns in API integration guidelines
- Create utility functions for common invalidation patterns
- Establish conventions for:
  - When to use optimistic updates vs invalidation
  - How to structure query keys for related data
  - Handling dependent queries

**Benefits**:
- Consistent cache management
- Prevents stale data issues
- Better user experience with optimistic updates
- Easier debugging

---

### 4. Discriminated Union Form Schema Pattern ⭐ **MEDIUM PRIORITY**

**Location**: `LinkAccountForm.schema.ts`

**Pattern Description**:
Using Zod discriminated unions for conditional form validation based on a discriminator field.

**Implementation Pattern**:
```typescript
const baseSchema = z.object({
  routingNumber: z.string().min(9).max(9),
  accountNumber: z.string().min(1),
  certify: z.boolean().refine((val) => val === true, {
    message: 'Please authorize to continue',
  }),
});

export const LinkAccountFormSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('INDIVIDUAL'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }).merge(baseSchema),
  z.object({
    accountType: z.literal('ORGANIZATION'),
    businessName: z.string().min(1, 'Business name is required'),
  }).merge(baseSchema),
]);
```

**Extraction Recommendation**:
- Document discriminated union patterns in form validation guidelines
- Create examples for common use cases:
  - Account type selection (Individual vs Organization)
  - Payment method selection
  - Address type selection (US vs International)
- Provide TypeScript type inference examples

**Benefits**:
- Type-safe conditional validation
- Clear form structure
- Better developer experience
- Prevents invalid form states

---

### 5. Status Message Consolidation Pattern ⭐ **MEDIUM PRIORITY**

**Pattern Description**:
Centralizing status messages in a single object/map for consistent messaging across components.

**Implementation Pattern**:
```typescript
const RECIPIENT_STATUS_MESSAGES: Record<string, string> = {
  MICRODEPOSITS_INITIATED: 'We initiated microdeposits to verify this account. This usually takes 1–2 business days.',
  READY_FOR_VALIDATION: 'Your microdeposits are ready to be verified. Please enter the amounts to complete verification.',
  ACTIVE: 'Your external account has been linked and is active.',
  PENDING: 'We are processing your account. This may take a moment.',
  INACTIVE: 'The account was linked but is currently inactive.',
  REJECTED: 'We could not link this account. Please review details or try again.',
};

// Usage
{RECIPIENT_STATUS_MESSAGES[status] ?? 'Unknown status'}
```

**Extraction Recommendation**:
- Create a status message utility/helper
- Consider i18n integration for status messages
- Document pattern for status message management
- Create type-safe status message maps

**Benefits**:
- Consistent messaging
- Easy to update messages
- Single source of truth
- Better maintainability

---

### 6. Dialog with Portal Pattern for Popovers ⭐ **MEDIUM PRIORITY**

**Pattern Description**:
Explicit portal configuration for popover components inside dialogs to prevent clipping issues.

**Implementation Pattern**:
```typescript
// Explicit portal for popover inside dialog
<Popover>
  <PopoverTrigger>...</PopoverTrigger>
  <PopoverContent portal={true}>
    {/* Content */}
  </PopoverContent>
</Popover>
```

**Extraction Recommendation**:
- Document portal usage patterns in component guidelines
- Create a wrapper component for popovers in dialogs
- Add to accessibility guidelines
- Test with various dialog configurations

**Benefits**:
- Prevents UI clipping issues
- Better z-index management
- Consistent behavior across browsers
- Improved accessibility

---

### 7. Component Composition with hideActions Prop ⭐ **MEDIUM PRIORITY**

**Pattern Description**:
Using props to control visibility of action buttons/UI elements for different use cases.

**Implementation Pattern**:
```typescript
type LinkedAccountCardProps = {
  recipient: Recipient;
  hideActions?: boolean;
  makePaymentComponent?: React.ReactNode;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

// Usage
<LinkedAccountCard
  recipient={recipient}
  hideActions={variant === 'singleAccount'}
  makePaymentComponent={<MakePayment />}
/>
```

**Extraction Recommendation**:
- Document composition patterns in component design guidelines
- Establish conventions for:
  - When to use props vs composition
  - Naming conventions for visibility props
  - Component variant patterns
- Create examples for common composition scenarios

**Benefits**:
- Flexible component reuse
- Cleaner component APIs
- Better separation of concerns
- Easier to maintain

---

### 8. onBlur Validation Pattern ⭐ **LOW PRIORITY**

**Pattern Description**:
Enabling validation on blur for better UX (validates after user leaves field).

**Implementation Pattern**:
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // or 'onChange' or 'onSubmit'
  reValidateMode: 'onBlur',
});
```

**Extraction Recommendation**:
- Document validation timing patterns
- Provide guidance on when to use each mode:
  - `onBlur`: Better UX, less aggressive
  - `onChange`: Real-time feedback
  - `onSubmit`: Minimal validation
- Create examples for different form types

**Benefits**:
- Better user experience
- Less aggressive validation
- Reduces form friction
- Professional feel

---

### 9. Container Query Pattern (Mentioned in PR) ⭐ **LOW PRIORITY**

**Pattern Description**:
Using CSS container queries for responsive design based on component size rather than viewport.

**Implementation Pattern**:
```css
@container (max-width: 768px) {
  .component {
    /* Mobile styles */
  }
}

@container (min-width: 769px) {
  .component {
    /* Desktop styles */
  }
}
```

**Extraction Recommendation**:
- Document container query usage in responsive design guidelines
- Provide examples for common responsive patterns
- Consider creating utility classes for container queries
- Test browser support and provide fallbacks

**Benefits**:
- Component-level responsiveness
- Better for embedded components
- More flexible than media queries
- Better for reusable components

---

### 10. Animation Patterns ⭐ **LOW PRIORITY**

**Pattern Description**:
Fade-in animations for header elements and consistent animation timing.

**Implementation Pattern**:
```typescript
// Fade-in animation
className="eb-animate-in eb-fade-in-0 eb-duration-200"

// Consistent animation classes
data-[state=open]:eb-animate-in
data-[state=closed]:eb-animate-out
data-[state=open]:eb-fade-in-0
data-[state=closed]:eb-fade-out-0
```

**Extraction Recommendation**:
- Document animation patterns in design system
- Create animation utility classes
- Establish animation timing standards
- Provide examples for common animations

**Benefits**:
- Consistent animations
- Better UX
- Professional appearance
- Smooth transitions

---

## UX Patterns Identified

### 1. Progressive Disclosure
- Account type selection first, then conditional fields
- Separators between form sections
- Clear visual hierarchy

### 2. Status-Driven UI
- Different UI states based on recipient status
- Conditional action buttons
- Status badges with appropriate variants

### 3. Empty State Handling
- Clear empty state messages
- Actionable empty states (e.g., "Link A New Account")
- Graceful degradation

### 4. Error State Management
- ServerErrorAlert for API errors
- Form validation errors
- Clear error messaging

### 5. Loading State Management
- Skeleton loaders
- Loading indicators
- Disabled states during operations

---

## Technical Patterns Identified

### 1. Form State Management
- React Hook Form with Zod validation
- Discriminated unions for conditional validation
- onBlur validation timing

### 2. API Integration
- Generated React Query hooks
- Proper query key management
- Cache invalidation patterns
- Error handling

### 3. Component Architecture
- Dialog-based forms
- Component composition
- Prop-based customization
- Variant support

### 4. Type Safety
- TypeScript strict mode
- Generated types from OpenAPI
- Type inference from Zod schemas

---

## Recommendations for Copilot Instructions

### High Priority Additions

1. **ServerErrorAlert Component Usage**:
   ```markdown
   ## Error Handling
   
   Always use ServerErrorAlert for API errors:
   ```typescript
   import { ServerErrorAlert } from '@/components/ux/ServerErrorAlert';
   
   <ServerErrorAlert
     error={apiError}
     customErrorMessage={{
       '400': 'Custom message',
       default: 'Default message'
     }}
     tryAgainAction={() => refetch()}
   />
   ```
   ```

2. **Loading State Patterns**:
   ```markdown
   ## Loading States
   
   Use skeleton components instead of "Loading..." text:
   ```typescript
   {isLoading && (
     <div className="eb-space-y-3">
       {Array.from({ length: count }).map((_, i) => (
         <Skeleton key={i} className="eb-h-12 eb-w-full" />
       ))}
     </div>
   )}
   ```
   ```

3. **Query Key Management**:
   ```markdown
   ## React Query Cache Management
   
   Always use generated query keys and invalidate after mutations:
   ```typescript
   import { getSmbdoGetClientQueryKey } from '@/api/generated/smbdo';
   
   queryClient.invalidateQueries({
     queryKey: getSmbdoGetClientQueryKey(clientId)
   });
   ```
   ```

### Medium Priority Additions

4. **Discriminated Union Schemas**:
   ```markdown
   ## Form Validation with Conditional Fields
   
   Use discriminated unions for conditional validation:
   ```typescript
   export const schema = z.discriminatedUnion('type', [
     z.object({ type: z.literal('A'), fieldA: z.string() }),
     z.object({ type: z.literal('B'), fieldB: z.string() }),
   ]);
   ```
   ```

5. **Status Message Management**:
   ```markdown
   ## Status Messages
   
   Centralize status messages in a single object:
   ```typescript
   const STATUS_MESSAGES: Record<Status, string> = {
     ACTIVE: 'Message',
     PENDING: 'Message',
   };
   ```
   ```

6. **Component Composition**:
   ```markdown
   ## Component Composition
   
   Use props to control visibility and composition:
   ```typescript
   type Props = {
     hideActions?: boolean;
     customComponent?: React.ReactNode;
   };
   ```
   ```

---

## Testing Patterns to Extract

1. **MSW Handler Reset Pattern**:
   ```typescript
   const renderComponent = () => {
     server.resetHandlers();
     // Setup handlers
   };
   ```

2. **Query Client Setup**:
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: { queries: { retry: false } }
   });
   ```

3. **Error State Testing**:
   ```typescript
   server.use(
     http.get('/api/endpoint', () => {
       return HttpResponse.json({ error: 'Error' }, { status: 500 });
     })
   );
   ```

---

## Documentation Updates Needed

1. **Component Library Documentation**:
   - Add ServerErrorAlert to component catalog
   - Document skeleton loading patterns
   - Add query key management guide

2. **Form Patterns Documentation**:
   - Discriminated union examples
   - Validation timing patterns
   - Conditional field patterns

3. **UX Patterns Documentation**:
   - Status-driven UI patterns
   - Empty state patterns
   - Error state patterns

4. **API Integration Guide**:
   - Query key management
   - Cache invalidation patterns
   - Error handling patterns

---

## Conclusion

PR #561 introduces several valuable patterns that should be extracted and standardized:

**Immediate Actions**:
1. Extract ServerErrorAlert to shared components
2. Document loading skeleton patterns
3. Create query key management guide

**Short-term Actions**:
4. Document discriminated union patterns
5. Create status message utilities
6. Document component composition patterns

**Long-term Actions**:
7. Create animation system documentation
8. Document container query patterns
9. Create comprehensive form pattern guide

These patterns will significantly improve consistency, maintainability, and developer experience across the component library.

