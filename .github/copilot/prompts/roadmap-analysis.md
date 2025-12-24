# Roadmap Analysis & Feature Planning

Use this prompt with: `@workspace` or mention this file in your question.

## Purpose

Analyze the codebase and generate a comprehensive roadmap of potential features, improvements, and technical debt.

## Prompt

```
Please conduct a comprehensive roadmap analysis of the embedded-banking monorepo:

## Phase 1: Codebase Analysis

Scan the codebase for:

### Architecture & Patterns
- Current architecture patterns in embedded-components
- TanStack Router patterns in client-next-ts
- Component composition patterns
- State management approaches
- API integration patterns (React Query usage)
- Testing strategies (MSW, Vitest, Playwright)

### Feature Gaps
- Missing components or patterns
- Incomplete implementations
- Areas lacking documentation
- Opportunities for reusable utilities
- Missing test coverage areas

### Technical Debt
- Code duplication opportunities
- Outdated dependencies
- Performance bottlenecks
- Accessibility issues
- Browser compatibility gaps

### Developer Experience
- Build time optimization opportunities
- Development workflow improvements
- Documentation gaps
- Tooling enhancements
- Storybook coverage

### User Experience
- Component usability improvements
- Theming and customization gaps
- Mobile responsiveness issues
- Loading state patterns
- Error handling improvements

## Phase 2: Prioritization Matrix

Categorize opportunities by effort and impact:

### Quick Wins (Low effort, high impact)
- Simple additions
- Documentation improvements
- Minor bug fixes
- Style consistency updates

### Medium Effort (Medium effort, medium-high impact)
- New component variants
- Refactoring opportunities
- Test coverage improvements
- Performance optimizations

### Strategic Initiatives (High effort, high impact)
- Major architectural changes
- New feature sets
- Platform expansions
- Major refactoring

### Low Priority (Various effort, low impact)
- Nice-to-have features
- Edge case handling
- Future considerations

## Phase 3: Timeline Roadmap

Create a Mermaid timeline diagram showing:
- Q1: Quick wins and foundation work
- Q2: Medium effort improvements
- Q3: Strategic initiatives phase 1
- Q4: Strategic initiatives phase 2

Use these theme colors:
- Primary: #F7F7F4
- Primary Border: #D4D4D0
- Secondary: #EAEBE7
- Tertiary: #FEF0ED
- Accent: #F34F1D

## Phase 4: Current vs Proposed Architecture

Create a Mermaid flowchart showing:
- **Solid borders** (#F7F7F4, #D4D4D0): Existing features/components
- **Dashed orange borders** (#FEF0ED, #F34F1D): Proposed additions
- **Solid arrows**: Direct dependencies
- **Dashed arrows**: Suggested connections

## Phase 5: Recommendations

Provide specific recommendations for:

### Immediate Actions (This Sprint)
1. [Specific, actionable items]
2. [With file paths and rationale]

### Next Quarter
1. [Medium-term improvements]
2. [With estimated effort]

### Long-term Vision
1. [Strategic initiatives]
2. [With dependencies and prerequisites]

## Package-Specific Considerations

### embedded-components:
- Component library expansion opportunities
- Storybook story coverage
- API wrapper improvements
- Theme system enhancements
- Accessibility improvements

### client-next-ts:
- Additional marketplace scenarios
- Theme variety expansion
- Content token improvements
- Route organization
- Demo experience enhancements

## Output Format

Provide:
1. Executive summary (3-5 bullet points)
2. Detailed analysis by category
3. Mermaid timeline diagram
4. Mermaid architecture diagram
5. Prioritized action items with effort estimates
6. Dependencies and prerequisites for each item

Reference existing documentation:
- `embedded-components/ARCHITECTURE.md`
- `embedded-components/BACKLOG.md`
- `app/client-next-ts/PRD.md`
- `.github/copilot-instructions.md`
```

## Usage

**In VS Code with GitHub Copilot:**
```
@workspace create a roadmap analysis following .github/copilot/prompts/roadmap-analysis.md
```

**Or simply:**
```
Please analyze the codebase and create a feature roadmap
```

## Related Files

- `embedded-components/BACKLOG.md` - Current backlog items
- `app/client-next-ts/PRD.md` - Product requirements
- `.github/copilot/skills/embedded-banking-architecture/SKILL.md` - Architecture patterns
