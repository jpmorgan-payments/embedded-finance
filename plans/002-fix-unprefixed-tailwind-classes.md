# Plan 002: Fix malformed/unprefixed Tailwind classes in ui primitives and close the lint loophole that lets them through

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1663e9a3..HEAD -- embedded-components/src/components/ui/stepper.tsx embedded-components/src/components/ui/input.tsx embedded-components/src/components/ui/sonner.tsx embedded-components/.eslintrc.cjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-consolidate-toast-to-sonner.md (soft — see Maintenance notes)
- **Category**: bug
- **Planned at**: commit `1663e9a3`, 2026-06-10

## Why this matters

This library compiles Tailwind with a mandatory `eb-` class prefix (`tailwind.config.js` + `components.json` both declare `prefix: "eb-"`). A class written without the prefix — or with a typo in it — generates **no CSS at all and fails silently**. The audit found four confirmed instances: the stepper loses `width:100%` in two places, the input carries a junk focus class, and **every sonner toast loses its themed background/border/foreground styling** because the stock-shadcn (unprefixed) classes were pasted in. The existing ESLint guard (`tailwindcss/no-custom-classname`) cannot catch these because its whitelist is the regex `eb\-.*` — so any string starting with `eb-` passes, valid or not, and it's only a `warn`. This plan fixes the four known instances and tightens the rule so the class of bug cannot recur.

## Current state

All paths relative to `embedded-components/`.

1. `src/components/ui/stepper.tsx:284` — typo `e-w-full` (missing `b`); generates nothing:

   ```tsx
   'e-w-full eb-flex eb-flex-wrap',
   ```

2. `src/components/ui/stepper.tsx:720` — unprefixed `w-full`; generates nothing:

   ```tsx
   variant === 'line' && 'w-full',
   ```

3. `src/components/ui/input.tsx:14` — the className string begins with `focus-visible:eb-default`. There is no `default` utility in `tailwind.config.js`; the class is junk. The real focus styling (`focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-offset-2` plus `eb-ring-ring`) is already present later in the same string, so the fix is to **delete** the junk token, not replace it.

4. `src/components/ui/sonner.tsx:6-27` — the whole component, as it exists today:

   ```tsx
   const Toaster = ({ ...props }: ToasterProps) => {
     const { theme = 'system' } = useTheme();

     return (
       <Sonner
         theme={theme as ToasterProps['theme']}
         className="eb-toaster eb-group"
         toastOptions={{
           classNames: {
             toast:
               'group-[.toaster]:eb-pointer-events-auto group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
             description: 'group-[.toast]:text-muted-foreground',
             actionButton:
               'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
             cancelButton:
               'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
           },
         }}
         {...props}
       />
     );
   };
   ```

   Two distinct breakages, both inherited from pasting stock (unprefixed) shadcn code into a prefixed project:
   - **Unprefixed utilities**: `bg-background`, `text-foreground`, `border-border`, `shadow-lg`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted` generate no CSS. With prefix, the utility (after the variant colon) must be `eb-…`, e.g. `group-[.toaster]:eb-bg-background`.
   - **Broken group-marker selectors**: with `prefix: "eb-"`, the Tailwind *group marker* class is `eb-group`, and `group-[.toaster]:` compiles to a selector requiring an ancestor with classes `.eb-group.toaster`. The root element has `eb-toaster eb-group` — there is no literal `toaster` class (`eb-toaster` appears in no CSS file; verified), so even correctly-prefixed utilities under `group-[.toaster]:` would not apply. Similarly the per-toast element gets literal classes `group toast` from the `toast:` string, but `group-[.toast]:` requires `.eb-group.toast` — the literal `group` token is not the marker, `eb-group` is.

5. `.eslintrc.cjs:27-34` — the loophole:

   ```js
   'tailwindcss/classnames-order': 'warn',
   'tailwindcss/no-custom-classname': [
     'warn',
     {
       config: 'tailwind.config.js',
       whitelist: ['eb\\-.*'], // Whitelist your custom prefix
     },
   ],
   ```

   Because the plugin already reads `tailwind.config.js` (which declares the prefix), valid `eb-*` utilities are recognized *without* the whitelist; the `eb\-.*` entry only serves to mask typos like `eb-default`. Intentional non-Tailwind literal classes that must stay whitelisted: `stepper__*` BEM-style hook classes used throughout `stepper.tsx` (e.g. lines 578, 599, 691, 716), and the sonner marker literals `toaster` / `toast` / `group` introduced by the fix below.

Conventions: prettier via `yarn format`; conventional-commit messages (e.g. `fix(dropzone): …` in `git log`). Quality sequence for this package: `yarn format`, `yarn build`, `yarn test`.

## Commands you will need

All run from `C:\dev\code\embedded-finance\embedded-components` (PowerShell: chain with `;`, never `&&`).

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `yarn install`     | exit 0              |
| Typecheck | `yarn typecheck`   | exit 0              |
| Lint      | `yarn lint`        | exit 0 (warnings allowed, errors not) |
| Unit tests| `yarn test:unit`   | all pass            |
| Build     | `yarn build`       | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `embedded-components/src/components/ui/stepper.tsx` (two class-string tokens only)
- `embedded-components/src/components/ui/input.tsx` (one token)
- `embedded-components/src/components/ui/sonner.tsx` (class strings only)
- `embedded-components/.eslintrc.cjs` (one rule entry)
- Additional `eb-*` typo fixes inside `embedded-components/src/components/ui/*.tsx` **only if** step 4's lint run flags them (see escape hatch).

**Out of scope** (do NOT touch):
- `src/components/ui/toast.tsx` — contains `sm:eb-eb-bottom-0` (doubled prefix) at line 19, but plan 001 deletes that whole file. If the file still exists when you run this plan, fix that token too (`sm:eb-bottom-0`) and note it in your report.
- Any behavioral/JSX change in `stepper.tsx` — keyboard accessibility is plan 003.
- `tailwind.config.js` — the config is correct; do not add utilities to make junk classes "valid".
- `app/client-next-ts/**`.

## Git workflow

- Branch: `advisor/002-fix-unprefixed-tailwind-classes`
- Commit style: `fix(ui): correct unprefixed/malformed eb- Tailwind classes and tighten lint guard`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the three mechanical tokens

- `stepper.tsx:284`: `'e-w-full eb-flex eb-flex-wrap'` → `'eb-w-full eb-flex eb-flex-wrap'`
- `stepper.tsx:720`: `variant === 'line' && 'w-full'` → `variant === 'line' && 'eb-w-full'`
- `input.tsx:14`: delete the leading `focus-visible:eb-default ` token (keep everything else byte-identical).

**Verify**: `grep -n "e-w-full\|focus-visible:eb-default" src/components/ui/*.tsx` → only matches, if any, are `eb-w-full` (the grep for `e-w-full` substring-matches `eb-w-full`; confirm no standalone `'e-w-full` and no `eb-default` remain). Then `yarn typecheck` → exit 0.

### Step 2: Repair sonner toast styling

In `sonner.tsx`, change only class strings:

- Root: `className="eb-toaster eb-group"` → `className="toaster eb-group"` (the literal `toaster` class is what `group-[.toaster]:` selects on; `eb-group` is the prefixed group marker and must stay).
- `toast:` string → `'group-[.toaster]:eb-pointer-events-auto eb-group toast group-[.toaster]:eb-bg-background group-[.toaster]:eb-text-foreground group-[.toaster]:eb-border-border group-[.toaster]:eb-shadow-lg'` (note: literal `group` becomes `eb-group` so nested `group-[.toast]:` variants can match; literal `toast` stays).
- `description:` → `'group-[.toast]:eb-text-muted-foreground'`
- `actionButton:` → `'group-[.toast]:eb-bg-primary group-[.toast]:eb-text-primary-foreground'`
- `cancelButton:` → `'group-[.toast]:eb-bg-muted group-[.toast]:eb-text-muted-foreground'`

**Verify**: `yarn build` → exit 0. Then visual check: `yarn storybook`, open any story that fires a toast (e.g. an Onboarding story triggering save) or temporarily judge via the built CSS: `grep -c "eb-bg-background" dist/` artifacts is unreliable — prefer the Storybook visual: toast should now show themed background/border instead of unstyled white. If no story fires a toast, state that in the report and rely on the class-string review.

### Step 3: Tighten the ESLint rule

In `.eslintrc.cjs`, replace the `no-custom-classname` entry with:

```js
'tailwindcss/no-custom-classname': [
  'error',
  {
    config: 'tailwind.config.js',
    whitelist: ['stepper__.*', 'toaster', 'toast', 'group'],
  },
],
```

(Severity `warn` → `error`; regex whitelist `eb\-.*` removed so real `eb-*` utilities are validated against the Tailwind config; intentional literal classes whitelisted explicitly.)

**Verify**: `yarn lint` → see step 4.

### Step 4: Run lint and triage

Run `yarn lint`. Expected: the four fixed locations no longer flag. New errors may surface — classes the old whitelist was masking.

- If a flagged class is a clear typo of an `eb-*` utility in `src/components/ui/` → fix it (same mechanical treatment as step 1) and list it in your report.
- If a flagged class is an intentional literal (hook class for CSS targeting, third-party class) → add it to the whitelist as a *specific* string, never a wildcard over `eb-`.
- **Escape hatch**: if the rule produces more than ~40 errors, or errors concentrated outside `src/components/ui/`, STOP and report the full list instead of fixing — the triage decision belongs to the maintainer.

**Verify**: `yarn lint` → exit 0.

### Step 5: Full quality gate

`yarn format` ; `yarn build` ; `yarn test` (all from `embedded-components/`).

**Verify**: all exit 0.

## Test plan

No new unit tests — these are compile-time class-string fixes; the guard is the ESLint rule itself (step 3), which is the regression test for this whole bug class. Existing suites must stay green: `yarn test:unit` → all pass. The sonner visual check in step 2 is the behavioral verification.

## Done criteria

ALL must hold (run in `embedded-components/`):

- [ ] `grep -rn "'e-w-full" src/` → no matches
- [ ] `grep -rn "eb-default" src/` → no matches
- [ ] `grep -rn "eb-eb-" src/` → no matches
- [ ] In `sonner.tsx`: `grep -n "group-\[.toaster\]:bg-\|group-\[.toast\]:text-\|group-\[.toast\]:bg-" src/components/ui/sonner.tsx` → no matches (all utilities prefixed)
- [ ] `.eslintrc.cjs` has `no-custom-classname` at `error` with no `eb\-.*` whitelist entry
- [ ] `yarn lint` exits 0
- [ ] `yarn typecheck`, `yarn build`, `yarn test:unit` all exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts above don't match the live code (drift since `1663e9a3`).
- Step 4 floods: >40 new lint errors, or errors mostly outside `src/components/ui/` — report the list, don't fix.
- The `tailwindcss/no-custom-classname` rule fails to recognize *valid* `eb-*` utilities after removing the whitelist (i.e. it flags `eb-flex`, `eb-h-10` etc.) — that means the plugin/config resolution is broken and the whitelist was load-bearing; report rather than re-adding the wildcard.
- Sonner toasts render *worse* after step 2 in the Storybook check.

## Maintenance notes

- Ordering with plan 001: 001 deletes `toast.tsx`, whose line 19 contains `sm:eb-eb-bottom-0`. Run 001 first and the `eb-eb-` done-criterion here is naturally satisfied; run 002 first and you must fix that token as noted in Scope.
- The eslint whitelist is now an explicit allow-list of literal classes. Anyone adding a new intentional non-Tailwind class (BEM hooks, third-party markers) must add it there — reviewers should treat whitelist growth as a signal to double-check.
- `eslint-plugin-tailwindcss` is pinned `^3.17.4` (compatible with Tailwind 3). If the repo later migrates to Tailwind 4, this rule's config option changes — revisit.
- Follow-up deliberately deferred: a repo-wide sweep for unprefixed classes outside `components/ui/` (the tightened rule will surface them incrementally).
