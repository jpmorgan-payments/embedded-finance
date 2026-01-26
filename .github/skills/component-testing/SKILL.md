---
name: component-testing
description: Comprehensive testing patterns for React components with MSW, React Query, and Vitest. Use when writing tests, setting up mocks, testing API interactions, or ensuring 80% coverage. Keywords - testing, MSW, React Query, Vitest, mocks, coverage, API testing.
license: MIT
metadata:
  version: "2.0.0"
  author: jpmorgan-payments
  lastUpdated: "2025-12-24"
  priority: critical
---

# Component Testing Patterns

Comprehensive testing patterns for React components with MSW, React Query, and Vitest. All components require comprehensive tests with minimum 80% coverage.

## When to Apply

Reference these patterns when:
- Writing new component tests
- Setting up MSW mocks for API interactions
- Testing React Query data fetching
- Ensuring test coverage requirements
- Testing user interactions and form validation
- Testing error states and loading states

## Quick Reference

### Test File Structure

- **File naming:** `ComponentName.test.tsx` next to `ComponentName.tsx`
- **Minimum coverage:** 80% line coverage
- **Colocation:** Tests must be next to implementation files

### Essential Setup

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/msw/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
```

### Test Coverage Requirements

- ✅ Minimum 80% line coverage
- ✅ Cover all user interaction paths
- ✅ Test all API integration points
- ✅ Verify error handling and edge cases
- ✅ Test accessibility features

## How to Use

For detailed instructions, examples, and patterns:

- **Full guide**: `AGENTS.md` - Complete testing documentation
- **Individual rules**: See `rules/` directory for specific testing patterns

## References

- See `embedded-components/ARCHITECTURE.md` for architecture patterns
- See `AGENTS.md` for complete testing documentation
- See `.github/skills/code-quality-workflow/` for testing workflows
