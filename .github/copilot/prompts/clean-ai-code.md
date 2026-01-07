# Clean AI-Generated Code Patterns

Use this prompt with: `@workspace` or mention this file in your question.

## Purpose

Remove AI-generated code patterns that are inconsistent with the project's established style and conventions.

## Prompt

```
Please review the current branch against main and clean up any AI-generated code patterns that are inconsistent with the project style:

## Patterns to Remove

### 1. Excessive Comments
Look for and remove:
- Comments that state the obvious (e.g., `// Set the value`)
- Redundant JSDoc that duplicates the code
- Comments a human developer wouldn't add
- Comments inconsistent with the file's existing style

**Keep:**
- Comments explaining complex business logic
- JSDoc on public APIs with actual documentation value
- TODO/FIXME comments with context

### 2. Defensive Programming Overuse
Remove unnecessary:
- Try-catch blocks in contexts where errors are already handled
- Null checks when types guarantee non-null
- Redundant validation in trusted codepaths
- Type guards when TypeScript already validates

**Keep:**
- Error boundaries at component roots
- Validation at public API boundaries
- Error handling for external API calls
- User input validation

### 3. Type Safety Issues
Fix:
- `any` casts used to bypass type errors
- Overly broad type assertions
- Missing generic constraints
- Improper use of `as unknown as Type`

**Replace with:**
- Proper type definitions
- Generic constraints
- Type narrowing with type guards
- Correct type inference

### 4. Style Inconsistencies
Look for patterns that differ from the rest of the file:
- Import ordering (should follow project conventions)
- Spacing and formatting
- Naming conventions (camelCase vs PascalCase vs kebab-case)
- File organization patterns

**Match:**
- Existing import organization in the file
- Spacing patterns in the file
- Naming conventions in the module
- Component/function structure patterns

### 5. Unnecessary Complexity
Simplify:
- Over-engineered abstractions
- Premature optimizations
- Unnecessary wrapper functions
- Overly nested conditionals

**Prefer:**
- Straightforward implementations
- Clear, linear logic flow
- Direct function calls
- Early returns for clarity

## Analysis Process

1. **Compare with main branch**
   ```powershell
   git diff main...HEAD
   ```

2. **Review each changed file** against these patterns

3. **Check consistency** with:
   - `embedded-components/ARCHITECTURE.md` (for component code)
   - Existing patterns in the same file/directory
   - Project-wide conventions in `.github/copilot-instructions.md`

4. **Make targeted changes** preserving:
   - Actual functionality improvements
   - Legitimate bug fixes
   - Proper error handling
   - Valuable documentation

## Package-Specific Patterns

### embedded-components:
- Match existing component structure in `src/core/`
- Follow hook patterns in similar hooks
- Match test patterns in colocated tests
- Use existing utility patterns in `src/lib/`

### client-next-ts:
- Match TanStack Router patterns in `src/routes/`
- Follow component patterns in `src/components/`
- Match MSW handler patterns in `src/msw/`

## Output

Provide:
1. **Summary** (1-3 sentences): What was changed and why
2. **File-by-file breakdown** (if requested):
   - File path
   - Pattern removed
   - Reason for removal
3. **Before/after examples** (if significant changes)

Keep the summary concise - focus on the impact, not every detail.
```

## Usage

**In VS Code with GitHub Copilot:**
```
@workspace clean up AI code patterns following .github/copilot/prompts/clean-ai-code.md
```

**Or simply:**
```
Please review and clean up any AI-generated code inconsistencies
```

## Related Files

- `embedded-components/ARCHITECTURE.md` - Architecture patterns to follow
- `.github/copilot-instructions.md` - Project conventions
- `.github/copilot/skills/react-patterns/SKILL.md` - React patterns
