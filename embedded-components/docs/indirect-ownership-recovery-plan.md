# Indirect Ownership — Recovery & Rectification Plan

> **Jira:** SMBDO-11796
> **Branch:** `feature/SMBDO-11796-indirect-ownership-wizard`
> **Spec:** [Indirect Ownership — Business Requirement Spec (UX Flow)](https://confluence.prod.aws.jpmchase.net/confluence/pages/viewpage.action?pageId=6179914255) (Confluence pageId `6179914255`)
> **Status:** Planning complete · implementation not started (Stage 1 was prototyped then reverted at user request)

---

## 1. Why bugs keep recurring (root cause)

A single concept — _"is this owner Direct or Indirect?"_ — is represented in **three uncoordinated places**:

| #   | Source                     | Where it lives                                                                                     |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | `owner.ownershipType`      | Derived from API data (`natureOfOwnership` + `parentPartyId`) in `transformPartyToBeneficialOwner` |
| 2   | `isIndirectToggled`        | Local per-card React state (the toggle switch)                                                     |
| 3   | `owner.ownershipHierarchy` | Whether an intermediary chain exists                                                               |

The **badge** reads #2, the **Build Chain button** reads a mix of #1/#2, the **confirm dialog** reads #3, and the transform recomputes #1 from data the MSW mock rewrites. Every fix nudges one and desyncs the others. This is duplicated state — the core defect.

---

## 2. Spec mental model (target behavior)

Two orthogonal attributes per declared owner, plus a chain:

| Attribute               | Values                                                                 | Applies to                               |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| **Owner type**          | Individual (`BENEFICIAL_OWNER`) or Business (`INTERMEDIARY_OWNER`)     | every declared owner                     |
| **Nature of ownership** | Direct or Indirect (default **Direct**)                                | **both** individuals _and_ businesses    |
| **Chain**               | ordered intermediary orgs, each `parentPartyId` → layer closer to root | required **only** when nature = Indirect |

**Two stages:**

- **Stage 1 – Declare structure:** gating question → add each ≥25% owner (type + nature) → build the intermediary chain for every _Indirect_ owner (individual **or** business).
- **Stage 2 – Collect details:** every declared party gets its required fields. Cannot finish until all complete.
  - Individual: DOB, residential address, country of residence, gov ID (SSN), nature.
  - Organization: name, type, gov ID (EIN), legal address, country of formation, nature.

**Rules:** default Direct · Indirect requires ≥1 intermediary · intermediaries are always organizations · a business can be a **terminal owner** with no beneficial owner beneath it (cases 3.3/3.4) · **max 4 owners total** (reject 5th).

**Payload:** direct owners → `POST /clients`; indirect owners + their intermediaries → `POST /parties` (one per party); `parentPartyId` = immediate parent; created closest-to-root outward; `natureOfOwnership` set per party.

---

## 3. Gaps between current implementation and spec

| Gap                  | Current behavior                                                                       | Spec requirement                                                                    |
| -------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Business nature      | Business = always intermediary, no Direct/Indirect choice                              | Business is a first-class owner with its own Direct/Indirect nature (cases 3.3/3.4) |
| Nature scope         | Treated as individual-only                                                             | Applies to both individuals and businesses                                          |
| Per-card toggle      | Local UI state not in spec; main bug source                                            | Nature declared when adding owner (default Direct)                                  |
| Owner arrays         | Two parallel arrays (`beneficialOwners`, `businessOwners`) with independent transforms | One derivation; views filtered from it                                              |
| Validations          | No dangling-intermediary check; `ERROR` status never produced                          | Test-4 (dangling intermediary → error); Indirect requires chain                     |
| Standalone vs wizard | Shared component only covers Stage 1; Stage 2 is wizard-only screens                   | Storybook should exercise the same paths as the wizard                              |

---

## 4. Locked decisions

1. **Toggle:** keep it, but make it _persist_ to `natureOfOwnership` via a callback (controlled from data, no local state).
2. **Business nature:** add Direct/Indirect choice to business owners.
3. **Data model:** keep two arrays but derive both from **one** transform pass.
4. **Standalone parity:** component owns both stages; storybook drives the full flow like the wizard.
5. **Sequencing:** staged delivery.

---

## 5. Staged implementation checklist

### Stage 1 — Single source of truth + toggle persistence

- [x] Add `onChangeOwnerNature?(ownerId, nature)` to `IndirectOwnershipProps`
- [x] Unify the two transform passes into **one** derivation (`allOwners`), then filter into `beneficialOwners` / `businessOwners`
- [x] Make the toggle controlled: `checked = owner.ownershipType === 'INDIRECT'`; delete `isIndirectToggled` state + its `useEffect`
- [x] Badge, Build/Edit Chain button, and confirm dialog all read from `owner.ownershipType`
- [x] Wire nature change in **standalone** mode (update local party `natureOfOwnership`; clear chain when → Direct)
- [x] Wire nature change in **wizard** mode (`OwnersSectionScreen` persists via party update API)
- [x] Typecheck + run `src/core/IndirectOwnership/` tests (180 passing); fixed stale mocks so spec-correct status logic (details required for COMPLETE) is reflected

### Stage 2 — Business owner nature + validations

- [x] Add Owner dialog: Business entity gets Direct/Indirect nature choice
- [x] Store `organizationDetails.natureOfOwnership` for business owners
- [x] Business top-level owners are first-class (count toward max-4; can have their own chain when Indirect)
- [x] Transform: business `ownershipType` derives from `organizationDetails.natureOfOwnership`
- [x] Status: Indirect owners (individual **or** business) require ≥1 intermediary in the chain (spec 3.4); Direct business owner complete on details (spec 3.3)
- [x] Enforce max 4 owners (reject 5th) counting individuals + businesses
- [ ] Dangling intermediary that leads to no BO and isn't a terminal business owner → error (test-4) — deferred to Stage 3 (payload-level validation)

### Stage 3 — Standalone ⇄ wizard parity

- [ ] Bring Stage 2 detail collection into the shared component (or expose it) so storybook drives the full flow
- [ ] Storybook story exercises add / edit / chain / detail paths identical to the wizard
- [ ] Remove or relocate any wizard-only logic the standalone lacks

---

## 6. Key files

| File                                                                                        | Role                                                                                          |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/core/IndirectOwnership/IndirectOwnership.tsx`                                          | Main component, `OwnerCard`, `AddOwnerDialog`, `HierarchyBuildingDialog`                      |
| `src/core/IndirectOwnership/utils/openapi-transforms.ts`                                    | `transformPartyToBeneficialOwner`, `determineOwnerStatus`, `hasRequiredDetailsPopulated`      |
| `src/core/IndirectOwnership/IndirectOwnership.types.ts`                                     | `IndirectOwnershipProps`, `BeneficialOwner`, `INTERMEDIARY_OWNER_ROLE`                        |
| `src/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen.tsx`               | Wizard integration: add/remove/hierarchy/nature handlers, gating effect, controller detection |
| `src/core/OnboardingFlow/forms/intermediary-section-forms/`                                 | `IntermediaryOrgDetailsForm`, `IntermediaryAddressForm`                                       |
| `src/core/OnboardingFlow/screens/IndirectOwnerDetailsScreen/IndirectOwnerDetailsScreen.tsx` | Stage 2 detail collection list (wizard-only today)                                            |
| `src/core/OnboardingFlow/config/flowConfig.ts`                                              | `owner-stepper`, `intermediary-stepper`, `indirect-owner-details` screens                     |

---

## 7. Progress log

| Date       | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-15 | Plan finalized after reviewing the Confluence UX Flow spec. Stage 1 prototyped then reverted at user request — no code changes currently applied.                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-07-15 | **Stage 1 implemented.** Single source of truth: `natureOfOwnership` → `owner.ownershipType` drives badge, chain button, toggle, and confirm dialog. Toggle is now a controlled input firing `onChangeOwnerNature` (no local `isIndirectToggled`). One transform derivation feeds both owner views. Nature change wired in standalone + wizard. All 180 IndirectOwnership tests green (fixed 4 stale mocks).                                                                                                                               |
| 2026-07-15 | **Stage 2 implemented.** Business owners now carry Direct/Indirect nature (`organizationDetails.natureOfOwnership`) in both standalone + wizard add handlers. `determineOwnerStatus` reworked: Indirect owners (individual or business) require a built chain (spec 3.4); direct business owners complete on details (spec 3.3). Max-4 now counts all top-level owners. Tests updated to spec-correct expectations. 180 IndirectOwnership + 326 OnboardingFlow tests green. Dangling-intermediary validation (test-4) deferred to Stage 3. |
| 2026-07-15 | **Stage 3 implemented (bounded).** Confirmed single shared component (no fork). Hardened boundary: standalone story now exercises controller/edit/gating props (`WithController` story). Fixed drift in `IndirectOwnerDetailsScreen` completion logic (removed stale `ownershipPercentage` requirement; realigned to spec fields). 506 IndirectOwnership + OnboardingFlow tests green, 0 lint errors, formatted. Dangling-intermediary payload validation remains a tracked follow-up. |
