# Code Review Checklist

Use this prompt with: `@workspace /review` or mention this file in your question.

## Purpose

Conduct a comprehensive code review following best practices for quality, security, and maintainability.

## Prompt

```
Please conduct a thorough code review of the current changes, focusing on:

## Functionality
- Verify the code does what it's supposed to do
- Check that edge cases are handled appropriately
- Confirm error handling is comprehensive and appropriate
- Identify any obvious bugs or logic errors
- Test critical paths and user flows

## Code Quality
- Assess code readability and structure
- Verify functions are small, focused, and single-purpose
- Check that variable and function names are descriptive
- Identify any code duplication that should be refactored
- Confirm the code follows project conventions and patterns
- Review adherence to ARCHITECTURE.md patterns (for embedded-components)

## Security
- Check for obvious security vulnerabilities
- Verify input validation is present and thorough
- Confirm sensitive data is handled properly
- Ensure no hardcoded secrets or credentials
- Review authentication and authorization logic

## Testing
- Verify adequate test coverage (minimum 80% for embedded-components)
- Check that tests are colocated with implementation
- Ensure tests cover edge cases and error scenarios
- Verify MSW mocks are properly configured

## Documentation
- Check that complex logic is commented
- Verify JSDoc comments on public APIs
- Ensure README or component docs are updated if needed

## Package-Specific Checks

### For embedded-components:
- Verify `eb-` prefix on all custom Tailwind classes
- Check individual hook/util files with colocated tests
- Confirm no aggregation barrels for components
- Verify minimal public API exports
- Run: `cd embedded-components && yarn test`

### For client-next-ts:
- Check TanStack Router patterns
- Verify theme and tone variant support
- Confirm MSW handlers are properly configured
- Run: `cd app/client-next-ts && npm test && npm run health-check`

Provide specific, actionable feedback with file paths and line numbers where applicable.
```

## Usage

**In VS Code with GitHub Copilot:**
```
@workspace review the current changes using .github/prompts/code-review.md
```

**Or simply:**
```
Please review my code changes following the code review checklist
```

## Related Files

- `.github/skills/code-quality-workflow/SKILL.md` - Automated quality checks
- `embedded-components/ARCHITECTURE.md` - Architecture patterns for components
