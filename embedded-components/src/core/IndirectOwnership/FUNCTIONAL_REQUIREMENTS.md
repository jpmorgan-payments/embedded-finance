# IndirectOwnership — Functional Requirements

This document describes **all existing behaviours** of the IndirectOwnership component in functional terms (requirements and principles only). It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Client data as source**: The component receives client data (e.g. from GET client). Beneficial owners are derived from parties with BENEFICIAL_OWNER role. Root company name is derived from client/parties. No direct API calls for list/create/update unless specified; component may be used in a read-only or editable context with parent handling persistence.
- **Direct and indirect ownership**: Owners can be individuals or organizations. Indirect owners have an ownership hierarchy (chain of entities from owner to root business). Hierarchy can be built or edited via UI; validation ensures chain integrity and optional 25% threshold.
- **Real-time validation**: Validation summary (total owners, complete, pending hierarchy, errors, canComplete, completion percentage) is computed from current state. Optional callback to parent when validation changes.
- **i18n and user events**: User-facing strings are localisable; key actions (view structure, add owner started/completed, remove owner completed, etc.) are emit points when parent supplies a handler.
- **Read-only mode**: When enabled, no add/edit/remove; display only.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Owner list**: List of beneficial owners with type (individual/organization), name, ownership type (direct/indirect), status (complete, pending hierarchy, error), and optional hierarchy summary. Separate grouping or labels for individuals vs businesses.
- **Add owner**: Dialog to add a new owner: entity type (individual/business), name fields (first/last or business name), ownership type (direct/indirect). On submit, owner is added to local state (and optionally persisted by parent).
- **Indirect hierarchy**: For indirect owners, a chain of entities from the owner to the root business. User can “build chain” or “edit chain” in a dialog: add/remove/edit entities (name, type, ownership percentage if applicable). Validation: chain must be connected and meet rules (e.g. 25% threshold). Tooltip or inline help may explain calculation.
- **Remove owner**: Remove action with confirmation. On confirm, owner is removed from list; optional callback and event.
- **Complete**: When all owners are complete (no pending hierarchy, no errors), parent may show “Complete” or call onOwnershipComplete with current owner list. Completion is blocked when validation summary indicates errors or incomplete hierarchies.
- **Validation summary**: Total owners, complete count, pending hierarchies, error count, canComplete, completion percentage. Optional display in UI; optional onValidationChange callback.

---

## 3. Functional Requirements by Area

### 3.1 Data and Initial State

- **Initial owners**: Beneficial owners are derived from client.parties where role includes BENEFICIAL_OWNER. Existing hierarchies are derived from parentPartyId or from stored custom hierarchies.
- **Root company**: Root company name is derived from client (e.g. organization party) for display and hierarchy context.
- **Custom hierarchies**: When user builds or edits an indirect owner’s chain, that hierarchy is stored in component state (or parent) so it is preserved and used for validation/display.

### 3.2 Owner List Display

- **Grouping**: Owners may be grouped or labeled by type (e.g. individuals, businesses). Each owner shows: name (individual: first + last; organization: business name), ownership type (direct/indirect), status (complete, pending hierarchy, error).
- **Status**: Complete = has required data and (if indirect) valid hierarchy. Pending hierarchy = indirect owner with incomplete or missing chain. Error = validation errors (e.g. invalid chain, missing required field).
- **Actions per row**: Add owner (global), Build chain / Edit chain (for indirect), Remove. In read-only mode, no actions.

### 3.3 Add Owner Dialog

- **Open**: “Add owner” (or equivalent) opens a dialog. Entity type: Individual or Business (or Organization). For individual: first name, last name (required). For business: business name (required). Ownership type: Direct or Indirect.
- **Submit**: On submit, validate required fields. Add new owner to list (with temporary ID if not yet persisted). If indirect, status is pending hierarchy until chain is built. Close dialog and optionally track event.
- **Cancel**: Close dialog without adding.

### 3.4 Build / Edit Chain (Indirect Ownership)

- **Open**: “Build chain” or “Edit chain” opens a dialog for that owner. Chain is the ordered list of entities from the owner (top) to the root business (bottom). Steps may show entity name, type (individual/company), ownership in next level, and whether they own the root directly.
- **Entity combobox**: User can search and select an existing entity (from client/parties or from other owners’ hierarchies) or enter a new name. Existing business names may be suggested or restricted to avoid duplicates where required.
- **Add/remove steps**: User can add steps to the chain and remove or reorder as allowed by product. Validation runs on change: chain must be connected; final ownership percentage (if used) must meet threshold (e.g. 25%).
- **Calculations tooltip**: A tooltip or inline help may explain how ownership is calculated (e.g. multiplication along the chain) and what “meets 25%” means.
- **Confirm**: On confirm, hierarchy is saved for that owner. Owner status becomes complete if valid, or error if validation fails. Dialog closes.
- **Cancel**: Close without saving changes to the chain.

### 3.5 Remove Owner

- **Confirmation**: Remove shows a confirmation (e.g. “Remove [name]?”). On confirm, owner is removed from the list. Pending removals may be tracked for analytics (e.g. remove completed event). Optional callback to parent.

### 3.6 Validation Summary

- **Computed**: totalOwners, completeOwners, pendingHierarchies, ownersWithErrors, hasErrors, errors list, canComplete, completionPercentage. canComplete is true only when all owners are complete (no pending hierarchy, no errors).
- **Callback**: When onValidationChange is provided, call it when validation summary changes (e.g. after add, remove, or hierarchy edit).
- **Display**: Optional UI block showing progress (e.g. “3 of 5 complete”) or blocking Complete button until canComplete.

### 3.7 Completion

- **onOwnershipComplete**: When parent triggers completion (e.g. user clicks “Complete” and canComplete is true), call onOwnershipComplete with the current list of beneficial owners (or transformed payload). Component does not persist to API unless implemented by parent.

### 3.8 Error Handling

- **Validation errors**: Shown inline per owner or per chain step. Errors list in validation summary aggregates all owner and hierarchy errors.
- **API or persistence errors**: If parent performs API calls, errors are handled by parent; component may display an error message passed as prop or via context.

### 3.9 Accessibility and UX

- **Dialogs**: Focus trap, Escape to close, accessible titles and labels.
- **Actions**: Buttons and menu items have accessible names (e.g. “Add owner”, “Build chain for [name]”).

### 3.10 Callbacks and Events

- **onOwnershipComplete(owners)**: Called when user completes and validation passes.
- **onValidationChange(summary)**: Called when validation summary changes.
- **User events**: View structure, add owner started/completed, remove owner completed (and optionally hierarchy built/edited) when handler is provided.

---

## 4. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- API contracts for persisting owners or hierarchies (see API/OpenAPI documentation).
- Exact 25% calculation formula (see product/compliance spec).
