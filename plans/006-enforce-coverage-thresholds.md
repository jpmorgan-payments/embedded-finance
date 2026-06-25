# Plan 006: Enforce a coverage-threshold ratchet so the documented 80% policy becomes machine-checked

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1663e9a3..HEAD -- embedded-components/vite.config.mjs embedded-components/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-consolidate-toast-to-sonner.md and plans/003-stepper-keyboard-accessibility.md (soft — both change the coverage baseline; running this last avoids re-measuring)
- **Category**: tests / dx
- **Planned at**: commit `1663e9a3`, 2026-06-10

## Why this matters

The repo's documentation (root `AGENTS.md` and `.github/skills/component-testing/`) states a **mandatory 80% minimum coverage** for components, but nothing enforces it: the Vitest coverage config defines provider/reporters/include paths and **no thresholds**, so a PR dropping coverage to any level still passes `yarn test:coverage`. Meanwhile 36 of ~48 ui primitives have no tests at all — an immediate hard 80% gate would simply fail. The honest, enforceable move is a **ratchet**: measure today's actual coverage, set thresholds just below it so the suite passes now but any regression fails, and raise the numbers as test plans (e.g. plan 003's stepper tests) land.

## Current state

- `embedded-components/vite.config.mjs:42-60` — the coverage block as it exists today (note: no `thresholds` key):

  ```js
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    // Vitest v4 includes only covered files by default; define include explicitly.
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      '**/*.test.{ts,tsx}',
      '**/*.story.{ts,tsx}',
      '**/*.stories.{ts,tsx}',
      '**/*.fixtures.{ts,tsx}',
      '**/*.mdx',
      '**/.storybook/**',
      '**/stories/**',
      '**/fixtures/**',
      '**/*.d.ts',
      '**/api/generated/**',
      '**/node_modules/**',
    ],
  },
  ```

- `embedded-components/package.json:69` — `"test:coverage": "vitest run --coverage",` exists; nothing consumes its result as a gate.
- Vitest here is v4 (`"vitest": "^4.1.5"`). v4 syntax for thresholds is `coverage.thresholds: { lines, functions, branches, statements }` (numbers are minimum percentages; the run exits non-zero when any metric falls below).
- CI: check `.github/workflows/` for the job that runs embedded-components tests; this plan only changes the local config — if a CI workflow already calls `yarn test` or `yarn test:coverage`, the gate becomes effective there automatically. Report which workflow (if any) runs coverage.

Conventions: conventional commits (`chore: ...`/`test: ...` in git log); quality sequence `yarn format`, `yarn build`, `yarn test`.

## Commands you will need

All run from `C:\dev\code\embedded-finance\embedded-components` (PowerShell: chain with `;`, never `&&`).

| Purpose   | Command               | Expected on success |
|-----------|-----------------------|---------------------|
| Install   | `yarn install`        | exit 0              |
| Coverage  | `yarn test:coverage`  | exit 0, prints coverage table |
| Unit tests| `yarn test:unit`      | all pass            |
| Typecheck | `yarn typecheck`      | exit 0              |

## Scope

**In scope**:
- `embedded-components/vite.config.mjs` — add `thresholds` inside the existing `coverage` block; nothing else in the file.
- `plans/README.md` — record the measured baseline in your status note.

**Out of scope** (do NOT touch):
- Writing new tests to raise coverage — that's the backlog item "ui primitive test expansion" in `plans/README.md`, not this plan.
- The `include`/`exclude` lists — changing them moves the measured number and would make the ratchet dishonest.
- CI workflow files — observe and report only.
- The documented "80%" claim in `.github/skills/` docs — once the ratchet lands, updating those docs to describe the ratchet is a one-line follow-up for the maintainer (note it in your report).

## Git workflow

- Branch: `advisor/006-coverage-ratchet`
- Commit style: `test: enforce coverage threshold ratchet in vitest config`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Measure the baseline

Run `yarn test:coverage` and record the four summary numbers (lines / statements / functions / branches) for "All files".

**Verify**: command exits 0 and prints the coverage table. Record the numbers in your report and in the `plans/README.md` status note.

### Step 2: Add the ratchet

In `vite.config.mjs`, inside the existing `coverage` object, add (using your measured numbers, each rounded **down** to the nearest whole percent, then minus 1 — headroom for line-count noise):

```js
thresholds: {
  lines: <floor(measured) - 1>,
  statements: <floor(measured) - 1>,
  functions: <floor(measured) - 1>,
  branches: <floor(measured) - 1>,
},
```

Add a one-line comment above it: `// Ratchet: raise these as coverage grows; never lower without maintainer sign-off.`

**Verify**: `yarn test:coverage` → still exits 0.

### Step 3: Prove the gate fires

Temporarily set `lines` to `99`, run `yarn test:coverage`, confirm it **fails** (non-zero exit, threshold error message). Restore the ratchet value.

**Verify**: failure observed with 99, success restored with the ratchet value. State both observations in your report.

### Step 4: Check CI wiring (observe only)

`Get-ChildItem ..\.github\workflows | Select-String -Pattern "test:coverage|test:unit|yarn test" -List` (or read the workflow files). Report whether any CI job will actually run the gated command.

**Verify**: a sentence in your report naming the workflow(s) or stating none runs coverage.

## Test plan

The threshold mechanism is itself the test; step 3 is its negative test. Full suite must stay green: `yarn test:unit` → all pass.

## Done criteria

ALL must hold:

- [ ] `vite.config.mjs` contains a `coverage.thresholds` block with four numeric values and the ratchet comment
- [ ] `yarn test:coverage` exits 0 at the ratchet values
- [ ] Step 3's negative test was performed and reported
- [ ] `yarn test:unit` and `yarn typecheck` exit 0
- [ ] Only `vite.config.mjs` (and `plans/README.md`) modified (`git status`)
- [ ] Baseline numbers recorded in `plans/README.md` status row

## STOP conditions

Stop and report back (do not improvise) if:

- `yarn test:coverage` fails or hangs **before any change** (broken baseline).
- Vitest v4 rejects the `thresholds` key shape (API drift) — report the error; do not downgrade packages.
- Measured baseline is wildly different from the audit's expectation of "well below 80%" in a way that suggests the include/exclude lists changed (drift) — re-run the drift check.

## Maintenance notes

- The ratchet only works if numbers go **up** over time: when test plans land (e.g. plan 003's stepper tests, future phone-input/calendar tests — see backlog), the maintainer should re-measure and raise the thresholds in the same PR.
- Anyone lowering a threshold in a PR is defeating the gate — reviewers should treat that as requiring explicit justification.
- Once CI runs `yarn test:coverage` (step 4 tells you whether it already does), the gate is organization-effective; if it doesn't, adding it to the workflow is the natural follow-up.
