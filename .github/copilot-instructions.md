# GitHub Copilot Instructions for Embedded Finance and Solutions Monorepo

## Repository Overview

This is a monorepo with two main active packages and utility packages:

```
/
├── embedded-components/        # ⭐ ACTIVE - UI Component Library
│   ├── src/                   # Component source code
│   ├── .storybook/            # Storybook configuration
│   ├── ARCHITECTURE.md        # Architecture source of truth
│   └── .cursorrules           # Package-specific config
│
├── app/
│   └── client-next-ts/        # ⭐ ACTIVE - Showcase Web Application
│       ├── src/               # TanStack Router app
│       ├── README.md          # Setup and development guide
│       ├── PRD.md             # Product requirements
│       └── .cursorrules       # Package-specific config
│
├── embedded-finance-sdk/      # Utility - TypeScript SDK (future)
├── browser-use/               # Utility - Testing agents (Python)
└── metrics/                   # Utility - Repository metrics
```

## 📦 Active Packages

### **1. embedded-components** - UI Component Library
- **Purpose**: Reusable React components for embedded finance APIs
- **Tech**: React 18 + TypeScript + Radix UI + Tailwind CSS + React Query
- **Build**: Vite library mode
- **Testing**: Vitest + MSW
- **Docs**: Storybook
- **Config**: `embedded-components/.cursorrules`

### **2. app/client-next-ts** - Showcase Application
- **Purpose**: Demonstrate embedded-components in marketplace scenarios
- **Tech**: TanStack Router + Vite + MSW + shadcn/ui
- **Features**: Multiple themes, tone variants, API mocking
- **Testing**: Vitest + Playwright health checks
- **Config**: `app/client-next-ts/.cursorrules`

## 🎯 Package-Specific vs Shared Rules

### Shared Across All Packages
- **Architecture patterns**: `embedded-components/ARCHITECTURE.md` (applies to component library only)
- **Agent Skills**: `.github/copilot/skills/` (cross-package guidance)
- **Code quality workflow**: Test-fix-verify for all code changes
- **PowerShell**: Use `;` not `&&` for command chaining
- **Git conventions**: Lowercase conventional commits

### Package-Specific
- **embedded-components**: See `embedded-components/.cursorrules` and `ARCHITECTURE.md`
- **client-next-ts**: See `app/client-next-ts/.cursorrules` and `README.md`

> **Always check package-specific `.cursorrules` for detailed configuration.**

## ⚠️ IMPORTANT: Package-Specific Architecture

### For embedded-components Package ONLY:

**All component code generation MUST follow the patterns defined in `embedded-components/ARCHITECTURE.md`.**

**Before generating component code, review:**
1. `embedded-components/ARCHITECTURE.md` - Complete architecture patterns
2. `embedded-components/.cursorrules` - Package configuration
3. `embedded-components/AGENTS.md` - Package-specific instructions

### For client-next-ts Application:

**Follow TanStack Router and showcase app patterns defined in:**
1. `app/client-next-ts/README.md` - Setup and routing guide
2. `app/client-next-ts/PRD.md` - Product requirements and vision
3. `app/client-next-ts/.cursorrules` - Application configuration

> **Note**: This app **consumes** embedded-components. Component development happens in `embedded-components/`.

## Technology Stack

### Shared Technologies (Both Packages)

- React 18.x with TypeScript (strict mode)
- Tailwind CSS for styling
- MSW for API mocking
- Vitest for unit testing

### embedded-components Specific

- Radix UI primitives for base components
- Tanstack React Query v5 for data fetching
- Zod for validation
- Storybook 8.x for component development
- Vite library mode for building
- **Tailwind prefix**: `eb-` for all custom classes

### client-next-ts Specific

- TanStack Router for file-based routing
- shadcn/ui for base UI components
- Playwright for health checks
- Vite for dev server and building
- Multiple theme support (SellSense, PayFicient, etc.)
- Content tokens for tone variants

### Component Implementation

> **Note**: These patterns apply to `embedded-components` package. For `client-next-ts` app-specific patterns, see `app/client-next-ts/README.md`.

1. **TypeScript**:

   - Use strict mode
   - Define explicit interfaces for props
   - Use proper type imports
   - No 'any' types

2. **React Patterns**:

   ```typescript
   import { FC } from "react";

   export interface ComponentNameProps {
     // Clear prop definitions with JSDoc comments
   }

   export const ComponentName: FC<ComponentNameProps> = (
     {
       // Destructured props
     }
   ) => {
     // Implementation
   };
   ```

3. **Hook Patterns (Modern 2025)**:

   ```typescript
   // ✅ CORRECT - Individual hook files
   // File: hooks/useComponentData.ts
   import { useQuery } from "@tanstack/react-query";

   export function useComponentData() {
     return useQuery({
       queryKey: ["component-data"],
       queryFn: () => fetch("/api/data"),
     });
   }

   // File: hooks/useComponentData.test.tsx
   import { renderHook, waitFor } from "@testing-library/react";
   import { useComponentData } from "./useComponentData";

   describe("useComponentData", () => {
     test("fetches data", async () => {
       const { result } = renderHook(() => useComponentData());
       await waitFor(() => expect(result.current.isSuccess).toBe(true));
     });
   });

   // File: hooks/index.ts
   export { useComponentData } from "./useComponentData";
   export { useComponentForm } from "./useComponentForm";
   ```

4. **Utility Patterns (Modern 2025)**:

   ```typescript
   // ✅ CORRECT - Individual util files
   // File: utils/formatValue.ts
   export function formatValue(value: number): string {
     return new Intl.NumberFormat("en-US").format(value);
   }

   // File: utils/formatValue.test.ts
   import { formatValue } from "./formatValue";

   describe("formatValue", () => {
     test("formats numbers correctly", () => {
       expect(formatValue(1000)).toBe("1,000");
     });
   });

   // File: utils/index.ts
   export { formatValue } from "./formatValue";
   export { validateInput } from "./validateInput";
   ```

5. **Import Patterns**:

   ```typescript
   // ✅ CORRECT - Direct imports (tree-shakeable)
   import { ComponentCard } from "./components/ComponentCard";
   import { ComponentSkeleton } from "./components/ComponentSkeleton";
   import { useComponentData } from "./hooks"; // Can use barrel for convenience

   // ❌ WRONG - Aggregation barrel (prevents tree-shaking)
   import { ComponentCard, ComponentSkeleton } from "./components"; // No index.ts!
   ```

6. **Styling**:

   - Use Tailwind CSS classes
   - **embedded-components**: Prefix custom classes with `eb-` (mandatory)
   - **client-next-ts**: Standard Tailwind classes (no prefix required)
   - Example (embedded-components):

     ```typescript
     // In your component
     <div className="eb-custom-class">

     // In tailwind.config.js
     module.exports = {
       theme: {
         extend: {
           // Custom classes should be prefixed
           '.eb-custom-class': {
             // styles
           }
         }
       }
     }
     ```

   - Follow design token system
   - Maintain responsive design
   - Base component example:
     ```typescript
     <div className="flex items-center space-x-4 p-4 rounded-lg bg-white shadow-sm eb-custom-style">
     ```

7. **Data Fetching**:

   ```typescript
   import { useQuery } from "@tanstack/react-query";

   const { data, isLoading } = useQuery({
     queryKey: ["key"],
     queryFn: () => fetch("/api/endpoint"),
   });
   ```

8. **Validation**:

   ```typescript
   import { z } from "zod";

   export const schema = z.object({
     // Schema definition
   });
   ```

### Testing Requirements (2025 Pattern)

Generate comprehensive tests that cover component functionality, API interactions, and user flows. Follow these patterns:

**Key Principles:**

- ✅ Tests colocated with implementation (not in separate `__tests__/` directories)
- ✅ One test file per implementation file
- ✅ Clear test structure with descriptive names

1. **Test Setup and Utilities**:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/msw/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Setup QueryClient for tests
const queryClient = new QueryClient();

// Mock data setup
const mockData = {
  // Component-specific mock data
};

// Mock context if needed
const mockContext = {
  // Context-specific mock data
};
```

2. **Component Rendering Helper**:

```typescript
const renderComponent = () => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit API mock handlers
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json(mockData);
    })
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: "enUS",
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ComponentName />
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};
```

3. **Test Structure**:

```typescript
describe("ComponentName", () => {
  // Mock external dependencies
  vi.mock("@/components/ui/someComponent", () => ({
    useSomeHook: () => ({ someFunction: vi.fn() }),
  }));

  test("renders correctly with initial data", async () => {
    renderComponent();

    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText(/expected text/i)).toBeInTheDocument();
    });
  });

  test("handles user interactions", async () => {
    renderComponent();

    // Simulate user actions
    await userEvent.click(screen.getByRole("button", { name: /action/i }));

    // Verify state changes
    expect(screen.getByText(/new state/i)).toBeInTheDocument();
  });

  test("handles API interactions", async () => {
    // Setup specific API mock for this test
    server.use(
      http.post("/api/endpoint", () => {
        return HttpResponse.json({ success: true });
      })
    );

    renderComponent();

    // Trigger API call
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Verify API interaction results
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

4. **Testing Best Practices**:

   - Test component rendering with different prop combinations
   - Verify user interactions and their effects
   - Test error states and loading states
   - Ensure proper API interaction handling
   - Test accessibility features
   - Cover edge cases and validation scenarios

5. **MSW API Mocking Patterns**:

```typescript
// Setup mock handlers
server.use(
  // GET requests
  http.get("/api/resource/:id", ({ params }) => {
    return HttpResponse.json(mockData[params.id]);
  }),

  // POST requests with response validation
  http.post("/api/resource", async ({ request }) => {
    const body = await request.json();
    if (!isValidData(body)) {
      return HttpResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Error scenarios
  http.get("/api/error-case", () => {
    return HttpResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  })
);
```

6. **Context and Provider Testing**:

```typescript
// For components using multiple contexts
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <EBComponentsProvider apiBaseUrl="/" headers={{}}>
      <FeatureContextProvider value={mockFeatureContext}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </FeatureContextProvider>
    </EBComponentsProvider>
  );
};

// Testing context updates
test("responds to context changes", async () => {
  const { rerender } = renderWithProviders(<ComponentName />);

  // Verify initial state
  expect(screen.getByText(/initial/i)).toBeInTheDocument();

  // Rerender with new context
  rerender(
    <FeatureContextProvider value={newMockContext}>
      <ComponentName />
    </FeatureContextProvider>
  );

  // Verify updated state
  expect(screen.getByText(/updated/i)).toBeInTheDocument();
});
```

7. **Test Coverage Requirements**:
   - Minimum 80% line coverage
   - Cover all user interaction paths
   - Test all API integration points
   - Verify error handling and edge cases
   - Test accessibility features
   - Include integration tests for complex flows

## ⚠️ CRITICAL: Code Quality Workflow

**After making ANY code changes in either package, you MUST:**

### For embedded-components:

1. **Run tests**: `cd embedded-components && yarn test`

   - This runs: typecheck → format:check → lint → test:unit
   - **DO NOT skip this step** - tests must pass before proceeding

2. **Fix any errors that appear**:

   - **TypeScript errors**: Fix type issues in the code
   - **Prettier/formatting errors**: Run `yarn format` to auto-fix
   - **Linting errors**: Run `yarn lint:fix` to auto-fix, or fix manually
   - **Test failures**: Update tests or fix implementation

3. **Re-run tests** until all pass:
   ```powershell
   cd embedded-components
   yarn test
   ```

### For client-next-ts:

1. **Run tests**: `cd app/client-next-ts && npm test`
2. **Format check**: `npm run format:check` or `npm run format` to auto-fix
3. **Health checks**: `npm run health-check` to verify app functionality

**Never commit code with:**

- ❌ TypeScript errors
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

**Quick Fix Commands:**

```powershell
# embedded-components
cd embedded-components
yarn format          # Auto-fix formatting
yarn lint:fix        # Auto-fix linting
yarn typecheck       # Check types only
yarn test            # Full test suite

# client-next-ts
cd app/client-next-ts
npm run format       # Auto-fix formatting
npm test             # Run tests
npm run health-check # Health checks
```

### Storybook Stories

> **Note**: Only for `embedded-components` package. `client-next-ts` uses its own showcase pages.

Generate stories as:

```typescript
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  tags: ["autodocs"],
  // Configuration
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Props
  },
};
```

## Provider Requirements

> **Note**: For `embedded-components` only. `client-next-ts` app wraps its routes with the provider.

Always wrap components with EBComponentsProvider:

```typescript
<EBComponentsProvider
  apiBaseUrl="https://api-url"
  theme={{
    colorScheme: "light",
    variables: {
      // Theme variables
    },
  }}
>
  {/* Components */}
</EBComponentsProvider>
```

## Best Practices

1. **Error Handling**:

   **Always use ServerErrorAlert for API errors:**

   ```typescript
   import { ServerErrorAlert } from "@/core/OnboardingFlow/components/ServerErrorAlert";

   <ServerErrorAlert
     error={apiError}
     customErrorMessage={{
       "400": "Please check the information you entered and try again.",
       "401": "Please log in and try again.",
       "500": "An unexpected error occurred. Please try again later.",
       default: "An unexpected error occurred. Please try again later.",
     }}
     tryAgainAction={() => refetch()}
   />;
   ```

   **For try-catch blocks:**

   ```typescript
   try {
     // Operation
   } catch (error) {
     if (error instanceof ApiError) {
       // Handle API errors
     }
     // Handle other errors
   }
   ```

2. **Accessibility**:

   - Include ARIA attributes
   - Ensure keyboard navigation
   - Maintain proper contrast ratios
   - Example:
     ```typescript
     <button
       aria-label="Action description"
       role="button"
       tabIndex={0}
     >
     ```

3. **Performance**:

   - Use React.memo for expensive components
   - Implement proper dependencies in useEffect
   - Use React.lazy for code splitting

4. **Documentation**:
   ```typescript
   /**
    * Component description
    * @param {ComponentNameProps} props - The component props
    * @returns {JSX.Element} The rendered component
    */
   ```

## Common Patterns

1. **Form Handling**:

   **Basic form setup:**

   ```typescript
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";

   const form = useForm({
     resolver: zodResolver(schema),
     mode: "onBlur", // Validates on blur for better UX
     reValidateMode: "onBlur",
   });
   ```

   **Discriminated Union Schemas (for conditional validation):**

   ```typescript
   import { z } from "zod";

   const baseSchema = z.object({
     commonField: z.string(),
   });

   export const formSchema = z.discriminatedUnion("type", [
     z
       .object({
         type: z.literal("INDIVIDUAL"),
         firstName: z.string().min(1, "First name is required"),
         lastName: z.string().min(1, "Last name is required"),
       })
       .merge(baseSchema),
     z
       .object({
         type: z.literal("ORGANIZATION"),
         businessName: z.string().min(1, "Business name is required"),
       })
       .merge(baseSchema),
   ]);
   ```

2. **API Integration**:

   **Using React Query mutations:**

   ```typescript
   import { useMutation, useQueryClient } from "@tanstack/react-query";
   import { getSmbdoGetClientQueryKey } from "@/api/generated/smbdo";

   const queryClient = useQueryClient();
   const mutation = useMutation({
     mutationFn: (data) => api.post("/endpoint", data),
     onSuccess: (response) => {
       // Invalidate related queries
       queryClient.invalidateQueries({
         queryKey: getSmbdoGetClientQueryKey(clientId),
       });
     },
   });
   ```

   **Query Key Management:**

   - Always use generated query keys from Orval
   - Invalidate queries after mutations
   - Use optimistic updates when appropriate
   - Structure query keys for related data

3. **Theme Usage**:

   ```typescript
   import { useTheme } from "@/hooks/useTheme";

   const { theme } = useTheme();
   ```

4. **Loading States**:

   **Always use skeleton components instead of "Loading..." text:**

   ```typescript
   import { Skeleton } from '@/components/ui/skeleton';

   {isLoading && (
     <div className="eb-space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
         <Skeleton key={i} className="eb-h-12 eb-w-full" />
       ))}
     </div>
   )}

   // For headers
   <Skeleton className="eb-h-6 eb-w-32" />
   <Skeleton className="eb-h-10 eb-w-28" />
   ```

5. **Status Message Management**:

   **Centralize status messages in a single object:**

   ```typescript
   const STATUS_MESSAGES: Record<Status, string> = {
     ACTIVE: "Your account is active.",
     PENDING: "We are processing your request.",
     INACTIVE: "The account is currently inactive.",
     REJECTED: "We could not process this request.",
   };

   // Usage
   {
     STATUS_MESSAGES[status] ?? "Unknown status";
   }
   ```

6. **Component Composition**:

   **Use props to control visibility and enable composition:**

   ```typescript
   type ComponentProps = {
     hideActions?: boolean;
     customComponent?: React.ReactNode;
     variant?: "default" | "compact";
   };

   export const Component: FC<ComponentProps> = ({
     hideActions = false,
     customComponent,
     variant = "default",
   }) => {
     return (
       <div>
         {/* Content */}
         {!hideActions && <ActionButtons />}
         {customComponent}
       </div>
     );
   };
   ```

7. **Dialog and Popover Patterns**:

   **When using popovers inside dialogs, use explicit portals:**

   ```typescript
   <Dialog>
     <DialogContent>
       <Popover>
         <PopoverTrigger>...</PopoverTrigger>
         <PopoverContent portal={true}>
           {/* Content - won't be clipped by dialog */}
         </PopoverContent>
       </Popover>
     </DialogContent>
   </Dialog>
   ```

Remember to maintain consistency with existing codebase patterns and follow the established project structure.

## Package-Specific Documentation

### embedded-components (Component Library)
- **Architecture**: `embedded-components/ARCHITECTURE.md` - Complete patterns
- **Agent Instructions**: `embedded-components/AGENTS.md` - Package-specific guide
- **Configuration**: `embedded-components/.cursorrules` - Quick reference
- **Contributing**: `embedded-components/CONTRIBUTING.md` - Contribution guide
- **Design Tokens**: `embedded-components/DESIGN_TOKENS.md` - Token system
- **Scripts**: `embedded-components/SCRIPTS_REFERENCE.md` - Build/dev scripts

### client-next-ts (Showcase Application)
- **Setup Guide**: `app/client-next-ts/README.md` - Complete development guide
- **Product Vision**: `app/client-next-ts/PRD.md` - Requirements and goals
- **Configuration**: `app/client-next-ts/.cursorrules` - Quick reference
- **MSW Setup**: `app/client-next-ts/MSW_SETUP.md` - API mocking guide

## Additional Resources

### Primary Resources

- **Architecture patterns**: `embedded-components/ARCHITECTURE.md` - **Source of truth for architecture**
- **Agent Skills**: `.github/copilot/skills/` - **Comprehensive, automated guidance**

### Agent Skills (VS Code Copilot)

The `.github/copilot/skills/` directory contains discoverable skills that GitHub Copilot automatically uses:

**Tier 1 - Critical Core:**
- `embedded-banking-architecture/` - Component structure and organization
- `component-testing/` - Testing with MSW and React Query
- `code-quality-workflow/` - Mandatory test-fix-verify workflow
- `styling-guidelines/` - Tailwind CSS with `eb-` prefix
- `react-patterns/` - React 18 hooks and patterns

**Tier 2 - Important:**
- `i18n-l10n/` - Internationalization and localization
- `windows-powershell/` - PowerShell commands (NEVER use `&&`)
- `test-and-fix-workflow/` - Automated testing workflow

See `.github/copilot/skills/README.md` for complete documentation.

### How Skills Work

Skills are automatically discovered and activated by GitHub Copilot based on your task:
- Creating components → `embedded-banking-architecture` skill
- Writing tests → `component-testing` skill
- Fixing errors → `code-quality-workflow` skill
- Applying styles → `styling-guidelines` skill

No manual activation needed!

