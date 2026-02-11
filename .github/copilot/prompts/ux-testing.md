# Comprehensive UX Testing & Backlog Update

Use this prompt with: `@workspace` or mention this file in your question.

## Purpose

Conduct thorough UX testing, code inspection, and backlog updates for embedded finance components.

## Prompt

```
Please conduct a comprehensive UX testing and backlog update session:

## Phase 1: Code Inspection

### Recent Changes Review
1. **Check Recent PRs** (if GitHub access available):
   - Review open and recently closed PRs
   - Document PR numbers, titles, and affected components
   - Note fixes related to existing backlog items

2. **Component Code Review**:
   Review these core components for consistency:
   - `embedded-components/src/core/OnboardingFlow/`
   - `embedded-components/src/core/LinkedAccountWidget/`
   - `embedded-components/src/core/Recipients/`
   - `embedded-components/src/core/TransactionsList/`
   - `embedded-components/src/core/AccountsDisplay/`
   - `embedded-components/src/core/MakePayment/`

3. **Pattern Analysis**:
   Check for consistency in:
   - Button styling and colors
   - Primary action button patterns
   - Footer colors and styles
   - Form patterns and validation
   - Modal/dialog patterns
   - Status badge implementations
   - Account/card number masking
   - Loading states (skeleton patterns)
   - Error handling (ServerErrorAlert usage)

### Compare with Previous Testing
- Review: `embedded-components/docs/ux-testing/` (latest report)
- Document which issues have been addressed
- Identify new issues or regressions

## Phase 2: Storybook Testing

For each component, test in Storybook:

### Components to Test:
1. **OnboardingFlow**
   - All steps and validation
   - Error states
   - Success flows
   - Form field patterns

2. **LinkedAccountWidget**
   - Account cards layout
   - Link account flow
   - Manage actions (view, edit, delete)
   - Empty states
   - Loading states

3. **Recipients**
   - Table view responsiveness
   - Add recipient flow
   - View recipient details
   - Filters (type, status)
   - Pagination
   - Search functionality

4. **TransactionsList**
   - Transaction cards/table
   - Transaction details modal
   - Filters (date, type, status)
   - Pagination
   - Search
   - Empty states

5. **AccountsDisplay**
   - Account cards
   - Account selection
   - Balance display
   - Account number masking

6. **MakePayment**
   - Payment form
   - Recipient selection
   - Amount input validation
   - Confirmation flow
   - Success/error states

### For Each Component:

#### Visual Testing
- [ ] Layout and spacing consistency
- [ ] Button styling (primary, secondary, tertiary)
- [ ] Color usage consistency
- [ ] Typography consistency
- [ ] Icon usage and sizing
- [ ] Border radius consistency
- [ ] Shadow and elevation patterns

#### Interaction Testing
- [ ] Button hover/active states
- [ ] Form field focus states
- [ ] Modal open/close animations
- [ ] Dropdown behavior
- [ ] Tooltip behavior
- [ ] Loading state transitions
- [ ] Error state displays

#### Responsive Testing
- [ ] Desktop view (1920px)
- [ ] Tablet view (768px)
- [ ] Mobile view (375px)
- [ ] Layout breaks/wrapping
- [ ] Touch target sizes

#### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Screen reader text
- [ ] Color contrast
- [ ] Error announcements

## Phase 3: Documentation

Create testing report: `embedded-components/docs/ux-testing/YYYY-MM-DD/UX_TESTING_REPORT.md`

### Report Structure:

#### Executive Summary
- Testing date and session ID
- Number of components tested
- Total issues found (critical, moderate, minor)
- Issues resolved since last testing
- New issues identified

#### Component-by-Component Analysis

For each component:
```markdown
### ComponentName

**Status**: ✅ Pass | ⚠️ Issues Found | ❌ Critical Issues

**Issues Found:**
1. [Critical/Moderate/Minor] Issue description
   - **Location**: File path and line number
   - **Current behavior**: What happens now
   - **Expected behavior**: What should happen
   - **Impact**: User impact description
   - **Suggested fix**: Technical approach

**Positive Observations:**
- What works well
- Good patterns to replicate

**Testing Coverage:**
- Visual: ✅/⚠️/❌
- Interaction: ✅/⚠️/❌
- Responsive: ✅/⚠️/❌
- Accessibility: ✅/⚠️/❌
```

#### Pattern Analysis
- Consistent patterns across components
- Inconsistencies to address
- Recommended standard patterns

#### Accessibility Summary
- WCAG compliance level
- Common accessibility issues
- Keyboard navigation gaps
- Screen reader issues

## Phase 4: Backlog Update

Update `embedded-components/BACKLOG.md`:

### Categorize Issues:
- **Critical**: Blocks functionality, severe UX issues
- **Important**: Significant UX impact, inconsistencies
- **Nice-to-have**: Polish, minor improvements
- **Future**: Larger initiatives, new features

### For Each Issue:
```markdown
## [Priority] Issue Title

**Component**: ComponentName
**Category**: Visual/Interaction/Accessibility/Performance
**Effort**: Small/Medium/Large
**Impact**: Critical/High/Medium/Low

**Description:**
Clear description of the issue

**Current Behavior:**
What happens now

**Expected Behavior:**
What should happen

**Technical Details:**
- File: path/to/file.tsx
- Related: Other files affected
- Dependency: What needs to happen first

**Acceptance Criteria:**
- [ ] Specific, testable criteria
- [ ] User-facing improvements
- [ ] Technical requirements
```

### Update Status:
- Mark completed items as ✅ Done
- Move in-progress items to 🚧 In Progress
- Add new items to appropriate priority sections
- Update effort/impact estimates based on findings

## Phase 5: Recommendations

Provide prioritized action items:

### Immediate Actions (This Sprint)
1. Critical issues blocking users
2. Quick wins with high impact

### Next Sprint
1. Important consistency fixes
2. Accessibility improvements

### Future Considerations
1. Larger refactoring opportunities
2. New features or enhancements

## Output Format

Provide:
1. **Executive summary** (3-5 key findings)
2. **Testing report** (full component analysis)
3. **Updated backlog** (with new items categorized)
4. **Action items** (prioritized list with effort estimates)

Reference files:
- `embedded-components/BACKLOG.md` - Current backlog
- `embedded-components/ARCHITECTURE.md` - Architecture patterns
- Previous UX testing reports in `embedded-components/docs/ux-testing/`
```

## Usage

**In VS Code with GitHub Copilot:**
```
@workspace conduct UX testing following .github/copilot/prompts/ux-testing.md
```

**Or simply:**
```
Please run comprehensive UX testing and update the backlog
```

## Related Files

- `embedded-components/BACKLOG.md` - Component backlog
- `embedded-components/docs/ux-testing/` - Previous testing reports
- `.github/copilot/skills/component-testing/SKILL.md` - Testing patterns
