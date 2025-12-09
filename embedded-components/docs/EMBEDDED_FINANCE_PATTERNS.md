# Embedded Finance Component Patterns

This document catalogues the most prominent UI/UX patterns extracted from the embedded-components codebase. These patterns complement the [Salt Design System patterns](https://www.saltdesignsystem.com/salt/patterns) and follow [Atomic Design principles](https://atomicdesign.bradfrost.com/chapter-2/) and [Nielsen's Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

---

## Pattern Refinement Matrix

This matrix tracks the implementation status of UI/UX patterns across all embedded finance components. Each pattern is grouped by functional area, with a brief description and current implementation status per component.

### Pattern Descriptions

**Data Display & Security**

- **Sensitive Data Masking**: Display sensitive information (account numbers, routing numbers) with masking and reveal toggle functionality
- **Status Badges**: Consistent status indicators using badge components with semantic colors
- **Compact Details**: Single-column, minimal-gap layout for displaying complex resource details in dialogs
- **Field Toggle**: Toggle control for showing/hiding optional or empty fields in detail views
- **Detail Navigation**: Pattern for navigating from data grids/tables/cards to detailed views (Dialog/Modal, Sheet, Drawer options)

**Forms & Validation**

- **Progressive Validation**: Multi-stage form validation with real-time feedback and schema-driven validation
- **Dialog Forms**: Forms presented in modal dialogs with scrollable content and proper focus management
- **Multi-Mode Forms**: Forms that support multiple input modes (existing selection vs. manual entry)
- **Config-Driven Forms**: Forms that adapt their fields, validation, and behavior based on configuration objects
- **Wizard/Stepper**: Multi-step wizard with progress tracking, step validation, and state persistence
- **Review Panel**: Side-by-side review panel that shows form summary and updates in real-time

**Data Tables & Lists**

- **Responsive Table/Cards**: Data tables that adapt to mobile screens by transforming into card layouts
- **Enhanced Data Grid**: Powerful data tables with TanStack Table providing sorting, filtering, pagination, and column visibility
- **Filter & Search**: Combined search and filter controls with real-time filtering and clear filters action
- **Pagination**: Server-side pagination with page size controls, navigation buttons, and result count display

**User Feedback & States**

- **Loading Skeletons**: Skeleton loading states that match the final content structure
- **Error with Retry**: Consistent error handling with actionable retry mechanisms
- **Empty States**: Helpful empty states that guide users on next actions when no data is available
- **Success States**: Dedicated success screens after form submission with next action options

**Navigation & Flow**

- **Timeline/Progress**: Visual timeline showing progress with clickable sections and completion tracking
- **Container Queries**: Responsive layouts using container queries instead of viewport queries

**Component Control**

- **Ref Control**: Exposing component methods to parent components via refs for programmatic control
- **Clipboard Copy**: Copy-to-clipboard functionality for sensitive data fields with visual feedback
- **Confirmation Dialog**: Confirmation dialogs for destructive actions with clear explanation of consequences
- **Staggered Animation**: Staggered fade-in animations for list items to create a polished appearance

**Technical Patterns** (see Technical Patterns section below)

- **i18n Integration**: Multi-language support with namespace organization and translation hooks
- **OAS-Driven API Integration**: Type-safe React Query hooks generated from OpenAPI Specifications
- **API Error Mapping**: Mapping API error responses to form field errors and user-friendly messages
- **Custom Hooks Pattern**: Extracting complex business logic into reusable custom hooks
- **Optimistic Update Pattern**: Immediately updating UI cache before server response with setQueryData + invalidateQueries for instant feedback
- **Context Provider Pattern**: Managing shared application state through React Context providers
- **Interceptor Status Pattern**: Waiting until API interceptors are ready before making requests

### Implementation Status Matrix

| Pattern                     | OnboardingFlow | Accounts | LinkedAccountWidget | MakePayment | TransactionsDisplay | Recipients  |
| --------------------------- | -------------- | -------- | ------------------- | ----------- | ------------------- | ----------- |
| **Data Display & Security** |
| Sensitive Data Masking      | -              | ✅       | -                   | -           | ⚠️ Needs            | ⚠️ Partial  |
| Status Badges               | -              | ✅       | ✅                  | -           | ✅                  | ✅          |
| Compact Details             | -              | ⚠️ Needs | ⚠️ Needs            | -           | ✅                  | ✅          |
| Field Toggle                | -              | ✅       | -                   | -           | ✅                  | ⚠️ Needs    |
| Detail Navigation           | -              | ⚠️ Needs | ⚠️ Needs            | -           | ✅ (Dialog)         | ✅ (Dialog) |
| **Forms & Validation**      |
| Progressive Validation      | ⚠️ Partial     | -        | -                   | ✅          | -                   | ✅          |
| Dialog Forms                | ⚠️ Partial     | -        | ✅                  | ✅          | -                   | ✅          |
| Multi-Mode Forms            | -              | -        | ⚠️ Needs            | ✅          | -                   | ⚠️ Low Prio |
| Config-Driven Forms         | ⚠️ Partial     | -        | -                   | ⚠️ Needs    | -                   | ✅          |
| Wizard/Stepper              | ✅             | -        | ⚠️ Needs            | ⚠️ Needs    | -                   | -           |
| Review Panel                | ⚠️ Needs       | -        | -                   | ✅          | -                   | ⚠️ Low Prio |
| **Data Tables & Lists**     |
| Responsive Table/Cards      | -              | ✅       | -                   | -           | ✅                  | ✅          |
| Enhanced Data Grid          | -              | -        | -                   | -           | ✅                  | ⚠️ Needs    |
| Filter & Search             | -              | -        | -                   | -           | ✅                  | ✅          |
| Pagination                  | -              | -        | -                   | -           | ✅                  | ✅          |
| **User Feedback & States**  |
| Loading Skeletons           | ⚠️ Partial     | ✅       | ✅                  | -           | ⚠️ Needs            | ✅          |
| Error with Retry            | ✅             | ✅       | ✅                  | -           | ✅                  | ✅          |
| Empty States                | -              | ✅       | ✅                  | -           | ⚠️ Basic            | ✅          |
| Success States              | -              | -        | ⚠️ Needs            | ✅          | -                   | ⚠️ Needs    |
| **Navigation & Flow**       |
| Timeline/Progress           | ✅             | -        | ⚠️ Needs            | ⚠️ Needs    | -                   | -           |
| Container Queries           | -              | ✅       | ✅                  | -           | -                   | ✅          |
| **Component Control**       |
| Ref Control                 | -              | ✅       | ⚠️ Needs            | -           | ✅                  | ⚠️ Needs    |
| Clipboard Copy              | -              | ✅       | -                   | -           | ✅                  | ⚠️ Needs    |
| Confirmation Dialog         | -              | -        | ✅                  | -           | -                   | ✅          |
| Staggered Animation         | -              | ✅       | ✅                  | -           | ⚠️ Needs            | ⚠️ Needs    |
| **Technical Patterns**      |
| i18n Integration            | ✅             | ✅       | ✅                  | ✅          | ⚠️ Needs            | ⚠️ Needs    |

**Legend**:

- ✅ = Well-implemented
- ⚠️ Needs = Pattern exists but needs refinement/implementation
- ⚠️ Partial = Partially implemented (some aspects done, others missing)
- ⚠️ Basic = Basic implementation, could be enhanced
- ⚠️ Low Prio = Pattern would be nice-to-have but lower priority for this component
- - = Not applicable

### UX Testing Findings Integration

Based on the UX Testing Report (December 2, 2025), the following issues have been identified and reflected in the matrix:

**Critical Issues Identified:**

- **Make Payment**: Form discoverability issue (hidden behind button) - Review Panel pattern needs improvement
- **Button Style Inconsistency**: Status Badges pattern needs standardization across all components
- **Account Number Masking**: Inconsistent masking patterns (4 vs 8 asterisks) - Sensitive Data Masking needs standardization
- **Filter Labels**: Inconsistent capitalization ("All Status" vs "All statuses") - Filter & Search pattern needs standardization
- **Pagination Format**: Inconsistent text formats - Pagination pattern needs standardization
- **Missing Tooltips**: Icon-only buttons lack tooltips - Component Control patterns need enhancement
- **Responsive Design**: Recipients table has horizontal scrollbar - Responsive Table/Cards needs improvement
- **Data Quality**: Many "N/A" values and "$NaN" display issues - Compact Details and Field Toggle patterns need refinement

---

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

- ✅ **Recipients**: Masking is implemented (`****1234` format) in RecipientDetails, RecipientCard, RecipientsTable. Missing: reveal toggle functionality like Accounts component.
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

- ✅ **Accounts**: Implements status badges for account states (OPEN, CLOSED, PENDING, SUSPENDED) with semantic color mapping
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

- ✅ **Accounts**: Error state implemented with Alert component and retry button following Recipients pattern
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

- ✅ **Accounts**: Empty state implemented with icon, title, and actionable guidance following LinkedAccountWidget pattern
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
- ✅ **Accounts**: Implements responsive card layout with useElementWidth hook for mobile/desktop adaptation

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Optimized for each device type
- ✅ **Aesthetic & Minimalist Design**: Clean adaptation
- ✅ **Recognition Rather Than Recall**: Consistent information across layouts

---

### Enhanced Data Grid Pattern (TanStack Table)

**Description**: Powerful data tables built with TanStack Table (formerly React Table) following shadcn/ui patterns, providing sorting, filtering, pagination, column visibility, and advanced interactions.

**Implementation**:

- **Primary**: `TransactionsDisplay/components/TransactionsTable/`
- **Secondary**: `app/client/src/features/Recipients/RecipientsTable.tsx`
- **Status**: ✅ Well-implemented with full feature set

**Pattern Details**:

```typescript
// Table setup with TanStack Table
const table = useReactTable({
  data,
  columns,
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onColumnVisibilityChange: setColumnVisibility,
  state: {
    sorting,
    columnFilters,
    columnVisibility,
  },
  initialState: {
    pagination: { pageSize: 25 },
    sorting: [{ id: 'createdAt', desc: true }],
  },
});

// Column definitions with sorting, filtering, formatting
export const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{formatName(row.original)}</div>,
    filterFn: (row, id, value) => {
      return row.getValue(id).toLowerCase().includes(value.toLowerCase());
    },
  },
  // ... more columns
];
```

**Features**:

- **Sorting**: All columns sortable with visual indicators (asc/desc/unsorted)
- **Filtering**: Multiple filter types (dropdown selects, text inputs, custom filter functions)
- **Column Visibility**: Toggle columns on/off via dropdown menu
- **Pagination**: Client-side pagination with page size controls (10, 20, 25, 30, 40, 50)
- **Column Headers**: Reusable `DataTableColumnHeader` component with sort/hide controls
- **Actions Column**: Dropdown menu for row actions (view, edit, delete, etc.)
- **Empty States**: Proper handling of no results
- **Loading States**: Skeleton loading during data fetch
- **Responsive**: Works across device sizes

**Component Structure**:

```
ComponentTable/
├── ComponentTable.tsx              # Main table component
├── ComponentTable.columns.tsx       # Column definitions
├── ComponentTableToolbar.tsx       # Filter controls
├── DataTablePagination.tsx         # Pagination controls
├── DataTableColumnHeader.tsx       # Sortable column header
└── DataTableViewOptions.tsx        # Column visibility toggle
```

**Column Definition Pattern**:

```typescript
// Default visible columns
{
  accessorKey: 'status',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Status" />
  ),
  cell: ({ row }) => (
    <Badge variant={getStatusVariant(row.getValue('status'))}>
      {row.getValue('status')}
    </Badge>
  ),
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id));
  },
}

// Hidden by default (toggleable)
{
  accessorKey: 'createdAt',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Created" />
  ),
  cell: ({ row }) => formatDate(row.original.createdAt),
}

// Actions column (always visible)
{
  id: 'actions',
  enableHiding: false,
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onView(row.original)}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row.original)}>
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

**Toolbar Pattern**:

```typescript
// Filter controls in toolbar
<div className="flex items-center gap-2">
  {/* Status Filter */}
  <Select
    value={statusFilter || 'all'}
    onValueChange={(value) => {
      table.getColumn('status')?.setFilterValue(
        value === 'all' ? undefined : [value]
      );
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="All statuses" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All statuses</SelectItem>
      {statusOptions.map((status) => (
        <SelectItem key={status} value={status}>
          {status}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* Text Filter */}
  <Input
    placeholder="Filter name..."
    value={nameFilter ?? ''}
    onChange={(event) =>
      table.getColumn('name')?.setFilterValue(event.target.value)
    }
  />

  {/* Reset Filters */}
  {isFiltered && (
    <Button
      variant="ghost"
      onClick={() => table.resetColumnFilters()}
    >
      Reset <X />
    </Button>
  )}
</div>
```

**Pagination Pattern**:

```typescript
// Pagination controls
<div className="flex items-center justify-between">
  <div className="text-sm text-muted-foreground">
    {table.getFilteredRowModel().rows.length} row(s) total
  </div>
  <div className="flex items-center gap-6">
    <div className="flex items-center gap-2">
      <p className="text-sm font-medium">Rows per page</p>
      <Select
        value={`${table.getState().pagination.pageSize}`}
        onValueChange={(value) => table.setPageSize(Number(value))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 20, 25, 30, 40, 50].map((size) => (
            <SelectItem key={size} value={`${size}`}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="text-sm font-medium">
      Page {table.getState().pagination.pageIndex + 1} of{' '}
      {table.getPageCount()}
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronsLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRight />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <ChevronsRight />
      </Button>
    </div>
  </div>
</div>
```

**Best Practices**:

1. **Column Organization**:
   - Most important columns visible by default
   - Less frequently used columns hidden by default (toggleable)
   - Actions column always visible, non-hideable

2. **Filtering**:
   - Use dropdown selects for enum values (status, type)
   - Use text inputs for searchable fields (name, ID, account number)
   - Provide "Reset" button when filters are active
   - Show filter count or active filter indicators

3. **Sorting**:
   - Default sort by most recent/important column (descending)
   - All data columns should be sortable
   - Use `DataTableColumnHeader` for consistent sorting UI

4. **Actions**:
   - Use dropdown menu for row actions (3+ actions)
   - Use icon buttons for single primary action
   - Group related actions together
   - Destructive actions (delete, deactivate) at bottom with red styling

5. **Performance**:
   - Use client-side filtering/sorting for < 1000 rows
   - Consider server-side pagination for large datasets
   - Memoize column definitions if using dynamic columns
   - Use `enableHiding: false` for critical columns

**Refinement Needed**:

- ⚠️ **Accounts**: Could benefit from enhanced data grid pattern
- ⚠️ **Recipients (embedded-components)**: Could migrate to this pattern
- ⚠️ **Server-side pagination**: Some tables may need server-side implementation

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Powerful filtering and sorting capabilities
- ✅ **User Control**: Column visibility, filter reset, pagination controls
- ✅ **Recognition Rather Than Recall**: Visible filter state, sort indicators
- ✅ **Visibility of System Status**: Loading states, empty states, row counts
- ✅ **Error Prevention**: Filter validation, disabled states for pagination

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

### Compact Resource Details Pattern

**Description**: Single-column, minimal-gap layout for displaying complex resource details in dialogs or panels. Optimized for space efficiency while maintaining readability.

**Implementation**:

- **Primary**: `TransactionsDisplay/TransactionDetailsSheet/TransactionDetailsSheet.tsx`
- **Secondary**: `Recipients/components/RecipientDetails/RecipientDetails.tsx`
- **Status**: ✅ Well-implemented with consistent field rendering

**Pattern Details**:

```typescript
// Helper function for consistent field rendering
const renderField = (label: string, value: any, formatter?: (val: any) => string) => {
  if (!value) return null;
  const displayValue = formatter ? formatter(value) : value || 'N/A';
  return (
    <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
      <Label className="eb-shrink-0 eb-text-sm eb-font-medium eb-text-muted-foreground">
        {label}
      </Label>
      <div className="eb-min-w-0 eb-flex-1 eb-text-right eb-text-sm eb-font-medium">
        {displayValue}
      </div>
    </div>
  );
};

// Section structure
<div className="eb-space-y-1.5">
  <h3 className="eb-text-sm eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground">
    Section Name
  </h3>
  <div className="eb-space-y-1">
    {renderField('Field Label', fieldValue)}
    {renderField('Another Field', anotherValue)}
  </div>
</div>
```

**Features**:

- Single-column layout (no grid columns)
- Minimal spacing (`eb-space-y-2` for sections, `eb-space-y-1` for fields)
- Label/value pairs with flex layout (label left, value right-aligned)
- Uppercase section headers with muted styling
- Compact font sizes (`eb-text-sm` for labels/values)
- No Card components for sections (spacing-only separation)
- Conditional field rendering (hide empty values)
- Prominent display for key values (amount, name)
- Subtle separators between sections (`eb-border-t-2 eb-border-border/40`)

**Status and State Display**:

Use Badge components for status and important state attributes:

```typescript
// Status with semantic variants
<Badge variant={getStatusVariant(status)} className="eb-text-sm">
  {status}
</Badge>

// Status variant mapping
const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'COMPLETED': return 'default';
    case 'PENDING': return 'secondary';
    case 'REJECTED':
    case 'RETURNED':
    case 'FAILED': return 'destructive';
    default: return 'outline';
  }
};
```

**When to Use Badges/Chips**:

- ✅ **Status values**: Transaction status, recipient status, account state
- ✅ **Type indicators**: Transaction type, payment method type
- ✅ **State attributes**: Active/Inactive, Verified/Unverified
- ❌ **Regular data fields**: Names, IDs, dates, amounts (use plain text)

**Dialog Header Structure**:

The resource name/identifier should be displayed in the DialogHeader (sticky area), not in the content. Include a resource type prefix for clarity:

```typescript
// Dialog wrapper (in parent component)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="eb-scrollable-dialog eb-max-w-3xl">
    <DialogHeader className="eb-pb-4">
      <DialogTitle>
        {resourceType}: {resourceName}
      </DialogTitle>
    </DialogHeader>
    <div className="eb-scrollable-content">
      <ResourceDetails {...props} />
    </div>
  </DialogContent>
</Dialog>
```

**Examples**:

- `Transaction: {transactionId}`
- `Recipient: {recipientName}`
- `Account: {accountNumber}`

**Optimal Element Order** (Based on Nielsen's Heuristics):

The recommended order for detail views follows UX best practices:

```typescript
// 1. Status Tags/Badges - Quick visual status indicators (first in content)
<div className="eb-flex eb-items-center eb-gap-2">
  <Badge variant={getStatusVariant(status)}>{status}</Badge>
  <Badge variant="outline">{type}</Badge>
</div>

// 3. Critical Alerts - Blocking issues (validation errors, critical warnings)
{!validation.isValid && (
  <Alert variant="destructive">
    <AlertDescription>
      {/* Error details */}
    </AlertDescription>
  </Alert>
)}

// 4. Informational Alerts - Contextual information (status descriptions, helpful tips)
<Alert>
  <Info className="eb-h-4 eb-w-4" />
  <AlertDescription>{statusDescription}</AlertDescription>
</Alert>

// 5. Actions - Available after user understands the state
{(showEditButton || showDeactivateButton) && (
  <div className="eb-flex eb-gap-2">
    {showEditButton && (
      <Button onClick={onEdit} variant="secondary" size="sm">
        Edit Resource
      </Button>
    )}
    {showDeactivateButton && (
      <Button onClick={onDeactivate} variant="secondary" size="sm">
        Deactivate
      </Button>
    )}
  </div>
)}

// 6. Details Sections - The actual resource data
<div className="eb-space-y-1.5">
  {/* Resource details */}
</div>

// 7. Close Button - Always at bottom, full width
<div className="eb-pt-3">
  <Button onClick={onClose} variant="outline" className="eb-w-full">
    Close
  </Button>
</div>
```

**Order Rationale** (Nielsen's 10 Heuristics):

1. **Title** → Visibility of System Status (users know what they're viewing)
2. **Tags/Badges** → Visibility of System Status (immediate status recognition)
3. **Critical Alerts** → Help Users Recognize Errors (blocking issues first)
4. **Informational Alerts** → Help & Documentation (contextual guidance)
5. **Actions** → User Control (actions available after understanding state)
6. **Details** → Recognition Rather Than Recall (information visible)
7. **Close** → User Control (easy exit)

**Action Placement Guidelines**:

- **Actions placement**: After alerts, before details (allows informed decisions)
- **Primary actions** (Edit): Inline with other actions, use `variant="secondary" size="sm"`
- **Destructive actions** (Deactivate, Delete): Same section, use red styling (`eb-text-red-600 hover:eb-bg-red-50`)
- **Close button**: Always full-width at bottom (`eb-w-full`)
- **Action buttons**: Use `size="sm"` for compact display
- **Action grouping**: Group related actions together in a flex container

**History and Timeline Details**:

For resources with history or timeline information, display in a dedicated section:

```typescript
// Timeline/History section
{resource.createdAt && (
  <>
    <div className="eb-border-t-2 eb-border-border/40" />
    <div className="eb-space-y-1.5">
      <h3 className="eb-text-sm eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground">
        Timeline
      </h3>
      <div className="eb-space-y-1">
        {renderField('Created', formatDateTime(resource.createdAt))}
        {renderField('Updated', formatDateTime(resource.updatedAt))}
        {renderField('Last Modified', formatDateTime(resource.lastModifiedAt))}
      </div>
    </div>
  </>
)}
```

**History Display Guidelines**:

- Use "Timeline" or "History" as section header
- Include: Created date, Updated date, Last modified date
- Format dates consistently using `toLocaleString()` or custom formatters
- Show most recent events first (if displaying event history)
- Use conditional rendering (only show if dates exist)

**Refinement Needed**:

- ⚠️ **Accounts**: Account details could use this pattern
- ⚠️ **LinkedAccountWidget**: Account details view could adopt this pattern

**Usability Alignment**:

- ✅ **Aesthetic & Minimalist Design**: Clean, space-efficient layout
- ✅ **Recognition Rather Than Recall**: Consistent field structure
- ✅ **Flexibility & Efficiency**: Quick scanning of information
- ✅ **Visibility of System Status**: Clear section organization with status badges
- ✅ **User Control**: Accessible actions for resource management

---

### Detail Navigation Pattern

**Description**: Pattern for navigating from data grids, tables, or cards to detailed resource views. Defines when to use Dialog (Modal), Sheet (Side Panel), or Drawer (Full Screen) for displaying detail information.

**Current Implementation**:

- **Primary**: `Recipients/Recipients.tsx` (Dialog for RecipientDetails)
- **Secondary**: `TransactionsDisplay/TransactionDetailsSheet/TransactionDetailsSheet.tsx` (Dialog for TransactionDetails)
- **Status**: ✅ Currently using Dialog (Modal) pattern consistently

**Pattern Details**:

```typescript
// Current Dialog (Modal) implementation
<Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
  <DialogContent className="eb-scrollable-dialog eb-max-w-3xl">
    <DialogHeader>
      <DialogTitle>Recipient: {recipientName}</DialogTitle>
    </DialogHeader>
    <div className="eb-scrollable-content">
      <RecipientDetails recipient={selectedRecipient} />
    </div>
  </DialogContent>
</Dialog>
```

**Navigation Triggers**:

Detail views are typically opened from:

1. **Data Grid/Table Actions**:
   - "Details" button in actions column
   - "View transaction details" button
   - Click on row (if enabled)

2. **Card Actions**:
   - "Details" button on card
   - "View" button
   - Click on card (if enabled)

3. **Menu Actions**:
   - "View Details" from dropdown menu
   - "More Info" from context menu

**Available Options**:

#### Option 1: Dialog (Modal) - Current Implementation

**Description**: Centered modal dialog that overlays the entire viewport.

**Implementation**:

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="eb-scrollable-dialog eb-max-w-3xl">
    <DialogHeader>
      <DialogTitle>Resource: {resourceName}</DialogTitle>
    </DialogHeader>
    <div className="eb-scrollable-content">
      <ResourceDetails {...props} />
    </div>
  </DialogContent>
</Dialog>
```

**Pros**:

- ✅ Focuses user attention on detail view
- ✅ Works well for embedded contexts (doesn't require full viewport)
- ✅ Familiar pattern (widely used)
- ✅ Good for medium-length content
- ✅ Easy to implement (shadcn/ui Dialog component)
- ✅ Maintains context of parent view (visible behind overlay)

**Cons**:

- ❌ Limited width (max-width constraints)
- ❌ Can feel cramped for very long content
- ❌ Blocks entire viewport (even with backdrop)
- ❌ May not feel native on mobile devices

**Best For**:

- Medium-length detail views (5-15 fields)
- Quick reference/details
- Embedded component contexts
- When parent context should remain visible

**Current Usage**:

- ✅ Recipients: RecipientDetails in Dialog
- ✅ TransactionsDisplay: TransactionDetails in Dialog

---

#### Option 2: Sheet (Side Panel)

**Description**: Side panel that slides in from right/left, overlaying part of the viewport while keeping parent view partially visible.

**Implementation**:

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right" className="eb-w-full sm:eb-w-[540px] lg:eb-w-[640px]">
    <SheetHeader>
      <SheetTitle>Resource: {resourceName}</SheetTitle>
    </SheetHeader>
    <div className="eb-scrollable-content">
      <ResourceDetails {...props} />
    </div>
  </SheetContent>
</Sheet>
```

**Pros**:

- ✅ More horizontal space than modal
- ✅ Parent view remains partially visible (better context)
- ✅ Feels more native on desktop
- ✅ Good for longer content
- ✅ Smooth slide-in animation
- ✅ Better for comparison workflows

**Cons**:

- ❌ Requires more viewport width
- ❌ May not work well in narrow embedded contexts
- ❌ Parent view partially obscured
- ❌ Less focus than modal

**Best For**:

- Longer detail views (15+ fields)
- When parent context is important
- Desktop-focused applications
- Comparison workflows (viewing multiple resources)

**Available Components**:

- ✅ `@/components/ui/sheet` (shadcn/ui Sheet component available)

---

#### Option 3: Drawer (Full Screen)

**Description**: Full-screen drawer that slides in from bottom (mobile) or side (desktop), taking over the entire viewport within the component container.

**Implementation**:

```typescript
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

<Drawer open={isOpen} onOpenChange={setIsOpen}>
  <DrawerContent className="eb-max-h-[96vh]">
    <DrawerHeader>
      <DrawerTitle>Resource: {resourceName}</DrawerTitle>
    </DrawerHeader>
    <div className="eb-scrollable-content eb-px-4 eb-pb-4">
      <ResourceDetails {...props} />
    </div>
  </DrawerContent>
</Drawer>
```

**Pros**:

- ✅ Maximum space for content
- ✅ Excellent for very long detail views
- ✅ Mobile-first approach (slides from bottom)
- ✅ Full focus on detail content
- ✅ Good for complex forms within details

**Cons**:

- ❌ Completely hides parent view
- ❌ May feel overwhelming for simple details
- ❌ Less context preservation
- ❌ Requires more scrolling for navigation

**Best For**:

- Very long detail views (20+ fields)
- Mobile-first applications
- Complex detail views with nested information
- When full focus is required

**Available Components**:

- ✅ `@/components/ui/drawer` (shadcn/ui Drawer component available)

---

#### Option 4: Inline Expansion (Alternative)

**Description**: Expand detail view inline within the table/card, pushing other content down.

**Implementation**:

```typescript
// Inline expansion in table row
{expandedRowId === recipient.id ? (
  <TableRow>
    <TableCell colSpan={columns.length}>
      <RecipientDetails recipient={recipient} />
    </TableCell>
  </TableRow>
) : null}
```

**Pros**:

- ✅ No overlay/blocking
- ✅ All context remains visible
- ✅ Good for quick details
- ✅ No navigation required

**Cons**:

- ❌ Limited space
- ❌ Can push content off-screen
- ❌ Not ideal for long content
- ❌ Can disrupt table layout

**Best For**:

- Quick reference details (3-5 fields)
- Expandable rows in tables
- When space is not a concern

---

### Decision Criteria

**Use Dialog (Modal) when**:

- ✅ Detail view has 5-15 fields
- ✅ Quick reference/details needed
- ✅ Embedded component context
- ✅ Parent context should remain visible
- ✅ Standard detail view pattern

**Use Sheet (Side Panel) when**:

- ✅ Detail view has 15+ fields
- ✅ Desktop-focused application
- ✅ Parent context is important
- ✅ Comparison workflows needed
- ✅ More horizontal space required

**Use Drawer (Full Screen) when**:

- ✅ Detail view has 20+ fields
- ✅ Mobile-first application
- ✅ Complex nested information
- ✅ Full focus required
- ✅ Maximum space needed

**Use Inline Expansion when**:

- ✅ Quick reference (3-5 fields)
- ✅ No overlay desired
- ✅ Space is not a concern
- ✅ Expandable row pattern

---

### Recommended Standardization

**Current State**: All components use Dialog (Modal) pattern

**Recommendation**: **Standardize on Dialog (Modal) for consistency** with option to use Sheet for specific use cases:

1. **Default**: Dialog (Modal) for all detail views
   - Consistent user experience
   - Works well in embedded contexts
   - Familiar pattern

2. **Exception**: Sheet (Side Panel) for very long detail views
   - Use when detail view exceeds 20 fields
   - Use when comparison workflows are needed
   - Document exception in component

3. **Mobile Consideration**:
   - Dialog can be full-width on mobile (`eb-max-w-full` on small screens)
   - Drawer can be used for mobile-specific flows if needed

**Implementation Pattern**:

```typescript
// Standardized detail navigation hook
export function useDetailNavigation<T>(resource: T | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [useSheet, setUseSheet] = useState(false); // For long content

  const openDetails = useCallback(
    (resource: T, options?: { useSheet?: boolean }) => {
      setSelectedResource(resource);
      setUseSheet(options?.useSheet ?? false);
      setIsOpen(true);
    },
    []
  );

  const closeDetails = useCallback(() => {
    setIsOpen(false);
    setSelectedResource(null);
  }, []);

  return {
    isOpen,
    useSheet,
    selectedResource,
    openDetails,
    closeDetails,
  };
}
```

**Refinement Needed**:

- ⚠️ **Decision Pending**: Standardize on Dialog vs. allow Sheet/Drawer options
- ⚠️ **Accounts**: Could add detail view navigation
- ⚠️ **LinkedAccountWidget**: Could add detail view navigation
- ⚠️ **Consistency**: Ensure all detail views use same pattern
- ⚠️ **Mobile Optimization**: Consider mobile-specific patterns

**Usability Alignment**:

- ✅ **User Control**: Easy to open/close detail views
- ✅ **Recognition Rather Than Recall**: Consistent navigation pattern
- ✅ **Flexibility & Efficiency**: Quick access to details
- ✅ **Visibility of System Status**: Clear indication of detail view state
- ✅ **Aesthetic & Minimalist Design**: Appropriate use of space

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

- ✅ **Recipients**: Implements container-based responsive detection via `useElementWidth` hook with `isMobile` and `isTablet` breakpoints
- ✅ **Accounts**: Implements container-based responsive detection via `useElementWidth` hook with `isMobile` breakpoint for card layout adaptation

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

- ⚠️ **Recipients**: Could expose `refresh()`, `clearFilters()`, `getRecipientsData()` via ref (currently no ref interface)
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

- ⚠️ **Recipients**: Currently dialog closes silently on success - could show success toast/confirmation message before closing
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

### Optimistic Update Pattern (React Query Cache Management)

**Description**: Pattern for immediately updating the UI cache before the server responds, then invalidating queries for eventual consistency. This provides instant feedback to users while ensuring data accuracy.

**Implementation**:

- **Primary**: `LinkedAccountWidget/hooks/useLinkedAccountForm.ts`
- **Secondary**: `LinkedAccountWidget/components/RemoveAccountDialog/RemoveAccountDialog.tsx`
- **Tertiary**: `LinkedAccountWidget/forms/MicrodepositsForm/MicrodepositsForm.tsx`
- **Status**: ✅ Well-implemented with setQueryData + invalidateQueries pattern

**Pattern Details**:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { getGetAllRecipientsQueryKey } from '@/api/generated/ep-recipients';
import { ListRecipientsResponse } from '@/api/generated/ep-recipients.schemas';

// Create mutation with optimistic update
const createMutation = useCreateRecipient({
  mutation: {
    onSuccess: (response) => {
      const queryKey = getGetAllRecipientsQueryKey({
        type: 'LINKED_ACCOUNT',
      });
      
      // 1. Optimistically update the cache
      queryClient.setQueryData(
        queryKey,
        (oldData: ListRecipientsResponse | undefined) => {
          if (!oldData?.recipients) {
            return {
              recipients: [response],
            };
          }

          return {
            ...oldData,
            recipients: [...oldData.recipients, response],
          };
        }
      );
      
      // 2. Invalidate queries for eventual consistency
      queryClient.invalidateQueries({
        queryKey,
      });
      
      onSuccess?.(response);
    },
  },
});

// Update mutation with optimistic update
const editMutation = useAmendRecipient({
  mutation: {
    onSuccess: (response) => {
      const queryKey = getGetAllRecipientsQueryKey({
        type: 'LINKED_ACCOUNT',
      });
      
      // 1. Optimistically update the cache
      queryClient.setQueryData(
        queryKey,
        (oldData: ListRecipientsResponse | undefined) => {
          if (!oldData?.recipients) return oldData;

          return {
            ...oldData,
            recipients: oldData.recipients.map((r) =>
              r.id === response.id ? response : r
            ),
          };
        }
      );
      
      // 2. Invalidate queries for eventual consistency
      queryClient.invalidateQueries({
        queryKey,
      });
      
      onSuccess?.(response);
    },
  },
});

// Delete mutation with optimistic update
const removeMutation = useAmendRecipient({
  mutation: {
    onSuccess: (response) => {
      const queryKey = getGetAllRecipientsQueryKey({
        type: 'LINKED_ACCOUNT',
      });
      
      // 1. Optimistically update the cache (remove item)
      queryClient.setQueryData(
        queryKey,
        (oldData: ListRecipientsResponse | undefined) => {
          if (!oldData?.recipients) return null;

          return {
            ...oldData,
            recipients: oldData.recipients.filter(
              (r) => r.id !== response.id
            ),
          };
        }
      );
      
      // 2. Invalidate queries for eventual consistency
      queryClient.invalidateQueries({
        queryKey,
      });
      
      onSuccess?.(response);
    },
  },
});

// Status update mutation (e.g., microdeposit verification)
const verifyMutation = useRecipientsVerification({
  mutation: {
    onSuccess: (data) => {
      const queryKey = getGetAllRecipientsQueryKey({
        type: 'LINKED_ACCOUNT',
      });
      
      // 1. Optimistically update the cache (change status)
      queryClient.setQueryData(
        queryKey,
        (oldData: ListRecipientsResponse | undefined) => {
          if (!oldData?.recipients) return oldData;

          return {
            ...oldData,
            recipients: oldData.recipients.map((r) =>
              r.id === recipientId
                ? { ...r, status: data.status === 'VERIFIED' ? 'ACTIVE' : r.status }
                : r
            ),
          };
        }
      );
      
      // 2. Invalidate queries for eventual consistency
      queryClient.invalidateQueries({
        queryKey,
      });
      
      onSuccess?.(data);
    },
  },
});
```

**Features**:

- **Instant UI updates**: Cache updated immediately with optimistic data
- **Eventual consistency**: `invalidateQueries` ensures fresh data from server
- **Type-safe cache updates**: TypeScript ensures correct data structure
- **Consistent query keys**: Use generated query key functions from Orval
- **Filter-aware caching**: Include relevant filters in query keys (e.g., `type: 'LINKED_ACCOUNT'`)
- **Null-safe operations**: Handle undefined/null cache gracefully

**Pattern Flow**:

1. **User Action**: User clicks button (create, edit, delete)
2. **Mutation Triggered**: React Query mutation called
3. **Server Request**: API call sent to server
4. **Optimistic Update**: `setQueryData` immediately updates cache with expected result
5. **UI Updates**: Component re-renders with optimistic data (instant feedback)
6. **Server Response**: Server returns actual data
7. **Cache Invalidation**: `invalidateQueries` marks cache as stale
8. **Background Refetch**: React Query refetches data in background
9. **UI Syncs**: Component re-renders with server data (eventual consistency)

**When to Use**:

✅ **Use optimistic updates for**:
- Create operations (add new item to list)
- Update operations (modify existing item)
- Delete operations (remove item from list)
- Status changes (mark as active/inactive/verified)
- All mutations that affect list/grid data

❌ **Don't use optimistic updates for**:
- Read operations (queries already cached)
- Operations with complex side effects
- Operations that might fail validation
- Bulk operations with many potential failures

**Best Practices**:

1. **Always invalidate after optimistic update**: This ensures data consistency
2. **Use specific query keys**: Include filters/params to target correct cache
3. **Handle null/undefined**: Check if cache data exists before updating
4. **Preserve data structure**: Maintain the same response shape in cache
5. **Use generated query keys**: Import from `@/api/generated/*` for consistency
6. **Order matters**: `setQueryData` → `invalidateQueries` → callbacks

**Common Patterns**:

```typescript
// CREATE: Add to list
recipients: [...oldData.recipients, response]

// UPDATE: Replace in list
recipients: oldData.recipients.map((r) => r.id === response.id ? response : r)

// DELETE: Remove from list
recipients: oldData.recipients.filter((r) => r.id !== response.id)

// STATUS UPDATE: Update specific field
recipients: oldData.recipients.map((r) => 
  r.id === recipientId ? { ...r, status: newStatus } : r
)
```

**Refinement Needed**:

- ⚠️ **OnboardingFlow**: Could use optimistic updates for form submissions
- ⚠️ **MakePayment**: Could use optimistic updates for payment submission
- ⚠️ **Accounts**: Could use optimistic updates for account operations
- ⚠️ **Recipients**: Already uses invalidateQueries, could add setQueryData for instant feedback
- ⚠️ **TransactionsDisplay**: Read-only component, optimistic updates not applicable

**Current Implementation Status**:

- ✅ **LinkedAccountWidget**: Fully implemented for create, edit, delete, and verify operations
- ⚠️ **Other components**: Most only use `invalidateQueries` without optimistic `setQueryData`

**Technical Benefits**:

- ✅ **Perceived Performance**: Instant UI feedback improves user experience
- ✅ **Reduced Loading States**: Users see immediate results without waiting
- ✅ **Data Consistency**: Eventual consistency ensures correctness
- ✅ **Type Safety**: TypeScript prevents cache data mismatches
- ✅ **Rollback Support**: React Query can rollback on error (with additional config)

**Usability Alignment**:

- ✅ **Visibility of System Status**: Immediate feedback on actions
- ✅ **User Control**: Users see their actions take effect instantly
- ✅ **Error Recovery**: Can rollback on error with proper error handling
- ✅ **Flexibility & Efficiency**: Reduces perceived latency

---

### Clipboard Copy Pattern

**Description**: Copy-to-clipboard functionality for sensitive data fields, IDs, and account numbers with visual feedback.

**Implementation**:

- **Primary**: `Accounts/Accounts.tsx` (lines 347-375)
- **Secondary**: `TransactionsDisplay/TransactionDetailsSheet/TransactionDetailsSheet.tsx` (lines 113-122)
- **Status**: ✅ Well-implemented with accessible buttons

**Pattern Details**:

```typescript
// Copy button with visual feedback
<Button
  size="icon"
  variant="outline"
  className="eb-h-6 eb-w-6 eb-opacity-0 eb-transition-opacity group-hover:eb-opacity-100"
  onClick={() => navigator.clipboard.writeText(value)}
>
  <CopyIcon className="eb-h-3 eb-w-3" />
  <span className="eb-sr-only">Copy {label}</span>
</Button>
```

**Features**:

- Hover-to-reveal copy buttons
- Accessible screen reader labels
- Visual feedback on hover
- Grouped with reveal toggle for sensitive data

**Refinement Needed**:

- ⚠️ **Recipients**: Could add copy for account numbers
- ⚠️ **MakePayment**: Could add copy for transaction reference IDs

**Usability Alignment**:

- ✅ **Flexibility & Efficiency**: Quick data copying
- ✅ **Error Prevention**: Avoids manual typing errors

---

### Confirmation Dialog Pattern

**Description**: Confirmation dialogs for destructive actions with clear explanation of consequences and cancel option.

**Implementation**:

- **Primary**: `LinkedAccountWidget/components/RemoveAccountDialog/RemoveAccountDialog.tsx`
- **Secondary**: `Recipients/Recipients.tsx` (deactivate confirmation)
- **Status**: ✅ Well-implemented with consequence explanation

**Pattern Details**:

```typescript
// Confirmation dialog with consequences
<Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="eb-flex eb-items-center eb-gap-2">
        <Trash2 className="eb-h-5 eb-w-5 eb-text-red-600" />
        Confirm Deletion
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this entity and all its ownership relationships?
      </DialogDescription>
    </DialogHeader>

    {/* Warning about cascading effects */}
    {hasChildren && (
      <div className="eb-rounded eb-border eb-border-amber-200 eb-bg-amber-50 eb-p-2">
        <AlertCircle className="eb-mr-1 eb-inline eb-h-4 eb-w-4" />
        This will also remove all children of this item.
      </div>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={confirmDelete}>
        <Trash2 className="eb-mr-2 eb-h-4 eb-w-4" />
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Features**:

- Clear action description
- Warning icon for destructive actions
- Explanation of consequences (cascading effects)
- Cancel as primary option
- Destructive button styling

**Refinement Needed**:

- ⚠️ **Accounts**: Could add confirmation for account-related actions
- ⚠️ **MakePayment**: Could add confirmation for large payments

**Usability Alignment**:

- ✅ **Error Prevention**: Prevents accidental destructive actions
- ✅ **User Control**: Easy to cancel
- ✅ **Help Users Recognize Errors**: Clear consequence explanation

---

### Hierarchical/Tree Data Pattern

**Description**: Pattern for rendering hierarchical data structures with expandable/collapsible tree nodes using accordions.

**Implementation**:

- **Status**: ⚠️ Pattern exists but not currently implemented in active components

**Pattern Details**:

```typescript
// Recursive tree building
const buildOwnershipTree = () => {
  const getChildren = (parentId: string, currentDepth = 0): any[] => {
    if (currentDepth >= maxDepth) return [];
    return parties
      .filter((p) => p.parentPartyId === parentId)
      .map((party) => ({
        ...party,
        children: getChildren(party.id, currentDepth + 1),
      }));
  };

  return [{ ...rootParty, children: getChildren(rootParty.id) }];
};

// Recursive rendering with accordions
const renderParty = (party, depth = 0) => {
  if (party.children?.length > 0) {
    return (
      <Accordion type="single" collapsible defaultValue={depth === 0 ? 'open' : undefined}>
        <AccordionItem value="open">
          <AccordionTrigger>{/* Party header */}</AccordionTrigger>
          <AccordionContent>
            {party.children.map((child) => renderParty(child, depth + 1))}
            {/* Action buttons */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
  return <Card>{/* Leaf node content */}</Card>;
};
```

**Features**:

- Recursive data structure building
- Depth limiting for performance
- Auto-expand root level
- Leaf nodes as cards
- Branch nodes as accordions
- Action buttons at each level
- Mobile-responsive layouts

**Refinement Needed**:

- ⚠️ This pattern could be extracted as a reusable TreeView component

**Usability Alignment**:

- ✅ **Recognition Rather Than Recall**: Visual hierarchy representation
- ✅ **Flexibility & Efficiency**: Expand/collapse for focus
- ✅ **Aesthetic & Minimalist Design**: Progressive disclosure

---

### Staggered Animation Pattern

**Description**: Staggered fade-in animations for list items to create a polished, sequential appearance.

**Implementation**:

- **Primary**: `LinkedAccountWidget/LinkedAccountWidget.tsx` (lines 136-155)
- **Status**: ✅ Well-implemented with CSS animations

**Pattern Details**:

```typescript
// Staggered animation on list items
{linkedAccounts.map((recipient, index) => (
  <div
    key={recipient.id}
    className="eb-animate-fade-in"
    style={{
      animationDelay: `${index * 50}ms`,
      animationFillMode: 'backwards',
    }}
  >
    <LinkedAccountCard recipient={recipient} />
  </div>
))}
```

**CSS Animation**:

```css
/* In tailwind.config.js or CSS */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.eb-animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
```

**Features**:

- Subtle 50ms delay between items
- Fade + slide up effect
- `backwards` fill mode for proper initial state
- Works with dynamic lists

**Refinement Needed**:

- ✅ **Accounts**: Implements staggered fade-in animation for account cards with 50ms delay
- ⚠️ **Recipients**: Could add staggered animation to recipient cards
- ⚠️ **TransactionsDisplay**: Could add staggered animation to mobile cards

**Usability Alignment**:

- ✅ **Aesthetic & Minimalist Design**: Polished visual experience
- ✅ **Visibility of System Status**: Content appearing sequentially

---

### Field Toggle Pattern

**Description**: Toggle control for showing/hiding optional or empty fields in detail views.

**Implementation**:

- **Primary**: `TransactionsDisplay/TransactionDetailsSheet/TransactionDetailsSheet.tsx` (lines 126-138)
- **Secondary**: `Accounts/Accounts.tsx` (sensitive info toggle)
- **Status**: ✅ Well-implemented with Switch component

**Pattern Details**:

```typescript
// Toggle for empty fields
const [hideEmpty, setHideEmpty] = useState(true);

// Toggle UI
<div className="eb-flex eb-items-center eb-gap-2">
  <Switch
    id="show-all"
    checked={!hideEmpty}
    onCheckedChange={(checked) => setHideEmpty(!checked)}
  />
  <Label htmlFor="show-all" className="eb-text-xs eb-text-muted-foreground">
    Show all fields
  </Label>
</div>

// Conditional rendering helper
const renderField = (label: string, value: any) => {
  if (hideEmpty && !hasValue(value)) return null;
  return (
    <div className="eb-flex eb-justify-between">
      <Label>{label}</Label>
      <span>{value || 'N/A'}</span>
    </div>
  );
};
```

**Features**:

- Default to hiding empty fields
- Easy toggle for "show all"
- Conditional rendering based on state
- Clean N/A fallback when showing empty

**Refinement Needed**:

- ⚠️ **Recipients**: RecipientDetails could use this pattern

**Usability Alignment**:

- ✅ **Aesthetic & Minimalist Design**: Reduces visual clutter
- ✅ **User Control**: Users choose detail level
- ✅ **Flexibility & Efficiency**: Quick toggle between views

---

### Internationalization (i18n) Pattern

**Description**: Pattern for integrating react-i18next for multi-language support with namespace organization and translation hooks.

**Implementation**:

- **Primary**: All components using `useTranslation` hook
- **Status**: ✅ Well-implemented in MakePayment, LinkedAccountWidget, OnboardingFlow

**Pattern Details**:

```typescript
// Hook usage with namespace
const { t } = useTranslation(['make-payment']);

// Translation with default value
{
  t('buttons.makePayment', { defaultValue: 'Make Payment' });
}

// Translation with variables
{
  t('success.processedDate', {
    defaultValue: `Processed on ${date.toLocaleDateString()}`,
  });
}

// Nested translations
{
  t([
    `status.paymentDisabledTooltip.${status}`,
    'status.paymentDisabledTooltip.unavailable',
  ]);
}
```

**Features**:

- Namespace-based organization
- Default values for development
- Variable interpolation
- Fallback translation keys
- Per-component namespaces

**Refinement Needed**:

- ✅ **Accounts**: i18n integration implemented with useTranslation hook and translation keys with default values
- ⚠️ **Recipients**: Partial i18n (some hardcoded strings)
- ⚠️ **TransactionsDisplay**: Partial i18n

**Usability Alignment**:

- ✅ **Match Between System and Real World**: User's language preference
- ✅ **Flexibility & Efficiency**: Multi-language support

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

### High Priority (Based on UX Testing Report)

1. **Standardize Status Badge System**: Create shared status badge component with consistent variants and colors across all components (UX Issue: Button style inconsistency)
2. **Standardize Sensitive Data Masking**: Fix inconsistent masking patterns (4 vs 8 asterisks) - always show last 4 digits with 4 asterisks (UX Issue: Account number masking inconsistency)
3. **Improve Make Payment Form Discoverability**: Add visual hints or preview that form opens on button click, improve field ordering consistency between tabs (UX Issue: Form discoverability)
4. **Standardize Filter Labels**: Use consistent capitalization ("All Statuses", "All Types" - title case, plural) across Recipients and TransactionsDisplay (UX Issue: Filter label inconsistency)
5. **Standardize Pagination Format**: Use consistent text format ("Showing 1-3 of 3" or "3 total") and default rows per page (10 or 25) across all components (UX Issue: Pagination format inconsistency)
6. **Add Tooltips to Icon-Only Buttons**: Add tooltips and ARIA labels to all icon-only buttons (UX Issue: Missing tooltips)
7. **Fix Data Quality Issues**: Fix "$NaN" display in Transaction Details, populate or hide "N/A" fields, improve Field Toggle pattern (UX Issue: Data quality)

### Medium Priority

1. **Enhance Error States**: Improve error handling in Accounts (currently basic implementation)
2. **Loading Skeletons for TransactionsDisplay**: Replace "Loading transactions..." text with proper skeleton structure
3. **Container Query Migration**: Migrate Accounts to container queries (Recipients uses `useElementWidth`, LinkedAccountWidget uses `@container`)
4. **Success State Standardization**: Add success toast/confirmation to Recipients and LinkedAccountWidget after create/edit
5. **Ref Control Enhancement**: Add ref-based control to Recipients and LinkedAccountWidget
6. **Clipboard Copy Pattern**: Add copy-to-clipboard to Recipients (account numbers) and MakePayment (reference IDs)
7. **Responsive Design Fixes**: Fix horizontal scrollbar in Recipients table, implement responsive table design (UX Issue: Responsive design)
8. **i18n Standardization**: Add internationalization to Accounts, Recipients, and TransactionsDisplay (currently missing or partial)

### Low Priority

1. **Wizard Pattern Extraction**: Extract wizard pattern from OnboardingFlow for reuse in MakePayment and LinkedAccountWidget
2. **Filter & Search Enhancement**: Add search/filter to Accounts
3. **Multi-Mode Form Pattern**: Extend to LinkedAccountWidget (manual account entry option)
4. **Configuration-Driven Forms**: Enhance MakePayment and OnboardingFlow with more configuration options
5. **Field Toggle Pattern**: Add show/hide empty fields toggle to Recipients details
6. **Staggered Animation Pattern**: Apply to Recipients cards and TransactionsDisplay mobile cards for polish
7. **Enhanced Data Grid Migration**: Migrate Recipients table to Enhanced Data Grid pattern (TanStack Table)

---

## References

- [Salt Design System Patterns](https://www.saltdesignsystem.com/salt/patterns)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/)
- [Nielsen's 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

---

_Last Updated: Refined pattern matrix with logical grouping, UX testing findings integration, and component reordering (OnboardingFlow, Accounts, LinkedAccountWidget, MakePayment, TransactionsDisplay, Recipients). Removed IndirectOwnership references. Matrix now includes pattern descriptions and reflects December 2025 UX testing findings._
