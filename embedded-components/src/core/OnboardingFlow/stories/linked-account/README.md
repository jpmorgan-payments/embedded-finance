# OnboardingFlow — Linked account stories

Storybook: **Core → OnboardingFlow → Linked account**

## Two UI surfaces in the product (not Storybook-only)

| Surface                     | File                                              | Role                                                                                                                          |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Overview — bank section** | `screens/OverviewScreen/OverviewScreen.tsx`       | Shows linked account **or** “Start” to open the link step. **Verify Account** when `READY_FOR_VALIDATION`.                    |
| **Link bank account step**  | `screens/LinkAccountScreen/LinkAccountScreen.tsx` | Create flow (`editable` / `prefillSummary`), multi-account management, or redirect to Overview for single existing accounts. |

Both surfaces use the shared **`RecipientCard`** component (from `RecipientWidgets`) for account display — the same component used by **LinkedAccountWidget**. This ensures consistent card rendering, action menus, status alerts, and microdeposit verification across all surfaces.

## Host flags: hiding Remove (no contradiction)

| Goal | Prop | Where |
| ---- | ---- | ----- |
| Hide Remove on **Overview** linked-account row | `hideLinkedAccountRemoval` | `OnboardingFlow` |
| Hide Remove on **Link step** existing-account cards | `hideLinkedAccountRemoval` | `OnboardingFlow` (same prop, propagated to `RecipientCard`) |
| Hide Remove in **widget** cards / table rows | `hideRemoveRecipient` | `LinkedAccountWidget` (via `BaseRecipientsWidget`) |

They apply to **different surfaces**. Use **both** when your app embeds onboarding Overview **and** the
standalone widget with the same policy.

## Multi-account options

When `linkAccountStepOptions.allowMultipleAccounts` is `true`:
- Existing linked accounts render as cards (using `RecipientCard`) above an "Add account" button.
- `existingAccountsDisplay` controls card style: `'detailed'` (default) shows full cards with status alerts, Verify, View Details, Edit, and Remove; `'compact'` shows minimal cards with an overflow menu.
- After successfully linking, a "Link another account" / "Done" prompt appears instead of auto-redirecting.
- `presetAccounts` can be combined with `allowMultipleAccounts` for guided sequential linking with a dropdown selector.

## Story files

- **`OnboardingFlow.LinkedAccount.States.story.tsx`** — Client States: lifecycle seeds, prefill variants, existing **ACTIVE** account.
- **`OnboardingFlow.LinkedAccount.Interactive.story.tsx`** — Play functions: full link + MSW state machine, prefill summary, **microdeposit verification from Overview** (story 3; slow pacing constants at top of play).
- **`OnboardingFlow.LinkedAccount.MultiAccount.story.tsx`** — Multi-account features: `partyId` passthrough, `presetAccounts` selector, `allowMultipleAccounts` sequential linking, existing accounts display (compact and detailed). Stories **5–10** omit `flowEntry` so the canvas opens on **Overview** (realistic handoff via **Manage linked accounts**); stories **1–4** keep `flowEntry: 'link-account'` to isolate link-step controls.

Shared MSW helpers: **`../story-utils.tsx`** (`buildApprovedClientLinkAccountStory`, `createOnboardingFlowHandlers`, linked-account mocks).

## Docs

OnboardingFlow overview (Storybook MDX): **`../Docs.mdx`** — full **Storybook decomposition** taxonomy plus _Linked account (Storybook)_.
