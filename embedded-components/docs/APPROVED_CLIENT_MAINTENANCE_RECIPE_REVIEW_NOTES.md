# Approved Client Maintenance Recipe Review Notes

## Purpose

This file tracks proposed clarifications and implementation findings that have not been deliberately promoted into the canonical `APPROVED_CLIENT_MAINTENANCE_RECIPE.md`.

Treat `APPROVED_CLIENT_MAINTENANCE_RECIPE.md` as the source of truth. Add new observations here first, review their evidence, and move them into the canonical recipe only through an explicit documentation change.

## Baseline

- Canonical recipe: `docs/APPROVED_CLIENT_MAINTENANCE_RECIPE.md`
- Baseline commit: `1cee1be2602b574944de0abcbc5be4be8d127873`
- Review date: 2026-09-09
- Compared source: the feature-branch working copy before it was restored to the baseline
- Raw comparison command: `git diff --ignore-all-space 1cee1be2602b574944de0abcbc5be4be8d127873 -- docs/APPROVED_CLIENT_MAINTENANCE_RECIPE.md`

The feature branch contained no committed recipe changes after the baseline commit. The reviewed delta consisted of uncommitted edits to an older recipe structure plus changes made during UI iteration.

## Initial Diff Inventory

The working recipe differed from the baseline canonical recipe by 440 inserted lines and 389 deleted lines. Most of that 829-line patch replaced the maintained structure with an older narrative structure, so preserving the raw patch as a second recipe would have obscured rather than clarified the proposed changes.

The semantic review against the baseline canonical recipe produced these dispositions:

| Working-copy change                                                   | Disposition                                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Product-only `NEW` state without a maintenance request ID             | Preserved below as a verified live observation.                                                                           |
| Document request generated immediately by the product `PATCH`         | Preserved below as a verified live observation with contractual scope still open.                                         |
| Product and party changes shown as one user-facing submission         | Preserved below as an accepted UX decision; the canonical recipe already requires one verification call.                  |
| Always-visible local ownership certification question                 | Rejected as an implementation interpretation not required by the canonical recipe.                                        |
| Ordinary party writes allowed during `INFORMATION_REQUESTED`          | Rejected pending contract confirmation; the canonical recipe intentionally limits behavior to documented task completion. |
| Automatic return to `REVIEW_IN_PROGRESS` without another verification | Retained as an open question rather than promoted as a rule.                                                              |
| Simplified pagination and correlation rules                           | Not preserved; the canonical recipe has stricter completeness and conflict requirements.                                  |
| Reorganized operations, examples, and review diagrams                 | Not preserved as a delta because the canonical recipe contains the maintained structure and newer guidance.               |

The canonical recipe was then restored byte-for-byte from the baseline above. Future observations should be added to this file as discrete entries rather than by editing the recipe directly.

## Verified Observations Proposed For The Recipe

### Product-only upgrade state

**Observation**

Adding `EMBEDDED_PAYMENTS / LIMITED_DDA_PAYMENTS` can return the new entry in `productDetails` with `onboardingStatus: NEW` without creating `ClientResponse.updateRequest` or a party-maintenance request ID.

**Evidence**

- Observed against the live API by the component consumer on 2026-09-09.
- Covered by `buildMaintenanceProjection.test.ts`: `projects a pending product without a maintenance request`.
- Covered by `maintenanceReview.test.ts`: `does not require a maintenance request ID for a product-only upgrade`.

**Assessment**

Valid implementation requirement and a useful recipe clarification. The canonical recipe already says product status and party-maintenance status are independent, but it does not state this concrete response shape.

The product detail may also omit the redundant `product` and `action` fields while returning `subProduct: LIMITED_DDA_PAYMENTS` with `onboardingStatus: NEW`. Normalize that sub-product to the `EMBEDDED_PAYMENTS` family and infer the pending operation as `ADD`; otherwise the product can appear in the raw client response while being omitted from the update banner and combined review.

A client response can contain stale terminal maintenance history at the same time as an active product update. Confirmed example: `ClientResponse.updateRequest.status: TERMINATED` and a party-level `updateRequest.status: TERMINATED` alongside `LIMITED_DDA_PAYMENTS.onboardingStatus: NEW`, with no active maintenance-request records. Select the user-facing active status independently: active party proposal first, active client maintenance envelope second, then active product status. Never let terminal maintenance history suppress an active product banner.

### Requirements generated by the product request

**Observation**

The Limited DDA Payments product `PATCH` can generate a document request while the new product remains `NEW`, before the verification call.

**Evidence**

- Observed against the live API by the component consumer on 2026-09-09.
- Covered by the product-upgrade component test that simulates a refetched `NEW` product and generated document request.

**Assessment**

Valid observed behavior, but not yet confirmed as a contractual guarantee for every client. The UI should refetch and render whatever appears in `ClientResponse.outstanding`; it must not assume that a particular requirement type is always generated.

### Product cancellation is separate from maintenance cancellation

**Observation**

Calling `DELETE /maintenance-requests/{requestId}` did not cancel a pending Limited DDA Payments product addition. The product remained present in `productDetails`.

**Evidence**

- Observed against the live API by the component consumer on 2026-09-10.
- Consistent with the product-only response carrying `onboardingStatus: NEW` without a party-maintenance request ID.

**Assessment**

Confirmed separation of cancellation lifecycles. The maintenance-request DELETE operation must not be presented as canceling a product proposal, including when product and party updates are reviewed together.

### Cancel a pending product addition

The current API specification and recipe do not document how to withdraw a pending product addition. Live API testing on 2026-09-10 confirmed that the symmetric product `REMOVE` command cancels a `NEW` Limited DDA Payments addition:

```json
{
  "productDetails": [
    {
      "product": "EMBEDDED_PAYMENTS",
      "subProduct": "LIMITED_DDA_PAYMENTS",
      "action": "REMOVE"
    }
  ]
}
```

Send this as `PATCH /clients/{clientId}` with a fresh idempotency key, then refetch the client and party-maintenance resources. The cancellation affects the product addition only; party-maintenance proposals remain active and must be reviewed, canceled, or submitted independently.

Expose Cancel product addition automatically while the Limited DDA Payments addition has `onboardingStatus: NEW`. Do not expose cancellation after verification moves the product to `REVIEW_IN_PROGRESS`, or while it is `INFORMATION_REQUESTED`, unless those statuses are separately tested and confirmed.

Keep product cancellation separate from the standard maintenance-request cancellation dialog. In a combined update, clearly tell the user that business and related-party maintenance changes will remain after the product addition is canceled.

## Accepted UX Decisions, Not API Contract

### One combined review and submission surface

Product updates and party-maintenance proposals are separate API resources, but the user reviews them as one change set because one verification call submits them together.

The combined review page should contain:

1. Product updates, using the product/sub-product tree.
2. Business and related-party changes, using current/proposed comparisons.
3. The complete ownership structure, including intermediary businesses.
4. API-returned outstanding requirements and formal attestation tasks.
5. Final review confirmations and the single Submit for review action.

This is a presentation decision. It does not merge product and party identifiers in the data layer.

### Review confirmations

Use two UI-only checkboxes before verification:

- The user reviewed the business and related-party information and confirms it is complete and accurate.
- The user reviewed the ownership structure and confirms it includes every qualifying individual and intermediary business that owns 25% or more.

These confirmations do not create an API attestation payload and must not be described as legal attestations. Formal attestations remain separate tasks discovered through `attestationDocumentIds` and require the structured attester data defined by the API.

### Product presentation

Use a passive product tree. Give the parent product a distinct header with product icon and stronger typography. Connect subordinate sub-products with visible branch lines.

- Active nodes use a neutral sub-product icon and the eyebrow Sub-product.
- A missing but eligible sub-product is an action-only branch containing Add Limited DDA Payments; do not repeat the same name as static content.
- Pending, review, action-required, and declined nodes replace the generic sub-product icon with the lifecycle icon and combine type plus state into one eyebrow, such as Sub-product pending addition.
- Do not repeat lifecycle state in a separate badge or label.
- Do not use a blue pending-row fill without a corresponding structural purpose; communicate pending state through the lifecycle icon and combined eyebrow.
- Keep static nodes visually passive and reserve controls for genuine actions.

The add-product page is intentionally different from overview and review. It should not repeat the product tree or simulate a selected node. Present an inline PackagePlus icon with the page title, a short About Limited DDA Payments section, a Before you request section, and the request command. Reuse PackagePlus for the corresponding overview Add action so the command is recognizable across entry points.

When a product update is active, use the same update-request banner pattern used for party maintenance, even when the product API returns no maintenance request ID. The banner owns the Review or required-action navigation; do not add a separate Continue upgrade action inside the product tree.

Do not ask "Has anything changed since this business was approved?" on a separate screen. The combined review already shows business, related-party, and ownership information and collects explicit completeness confirmations before verification.

This is a UI design choice, not a recipe requirement.

### Submission visibility while blocked

Keep the submission section visible when outstanding requirements remain. Use warning color and plain language to explain that submission is blocked, keep both review confirmations visible but disabled, and keep the disabled Submit for review button in place so users understand the purpose and destination of the page.

### Ownership management

- Show one page title and one description; do not repeat Ownership structure above the tree.
- Label the root as Your business rather than Business being maintained.
- Do not render an intermediary-specific empty prompt when no ownership children exist.
- Keep important relationship actions visible as text. Use a compact chevron control for View details rather than repeating View and Edit toolbars on every node.
- Use one root Add beneficial owner action that asks direct or indirect before opening the person form.
- When indirect ownership is selected, let the user choose an existing intermediary or add one, then continue directly into the indirect-owner form.
- When converting an existing direct owner, use a specialized Choose an intermediary for [owner] screen. Do not display a direct option or generic choice language when indirect is the only valid outcome.
- Draw ownership connectors per child node rather than as one full-height border on the child list. Each final child stops its vertical spine at the branch midpoint. Apply the same first/last geometry recursively for every intermediary level so no connector continues below the final branch.
- Do not repeat a building icon wherever an intermediary business is mentioned. Text and hierarchy identify entity type. Use Network for relationship changes, Plus for add-layer commands, and no leading icon on existing-intermediary selection rows.

## Rejected Or Superseded Interpretations

### Always-visible ownership certification radio

**Rejected UI**

- Section title: `Ownership through another business`
- Caption: `Less common ownership arrangement`
- Radio choices for direct-only versus indirect ownership

**Reason**

The canonical recipe does not require a local ownership certification question. It requires the ownership data to be reviewable and requires API-returned attestations to be completed. An always-visible radio is confusing when a user is merely viewing ownership and incorrectly characterizes one arrangement as less common.

Replace the radio with the actual ownership hierarchy, edit actions, and a review checkbox on the combined review page.

### Local confirmation treated as formal attestation

A checkbox or radio stored only in component state is not equivalent to an API attestation. Do not label local review confirmations as attestations or use them to satisfy `attestationDocumentIds`.

### Unrestricted writes during `INFORMATION_REQUESTED`

The superseded working recipe stated that ordinary writes remain available and that completing returned tasks automatically resumes review without another verification call. The canonical recipe intentionally limits the UI to completion operations documented for the returned task and retains this lifecycle behavior as an open contract question.

Do not promote the broader claim without API confirmation.

## Already Covered By The Canonical Recipe

No additional recipe change is needed for these points:

- Product and party proposal states are tracked independently.
- Product and party changes are combined only in the presentation `ChangeSet`.
- One verification call submits the reviewed product and party changes.
- Every supported outstanding item must be resolved before initial verification.
- Product and party overlays are removed independently when their status becomes terminal.
- Multiple open party-maintenance request IDs block attestation and verification.
- Sparse party updates merge nested objects and replace supported arrays according to the documented contract.
- Approved publication can lag proposal approval; continue refetching during the documented publication window.

## Open Questions Requiring Confirmation

| Question                                                                                                                  | Current implementation posture                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Is immediate document-request generation after the product `PATCH` contractual or conditional?                            | Refetch and render returned outstanding work without assuming a requirement type.          |
| Which writes are permitted for each `INFORMATION_REQUESTED` product or party state?                                       | Expose only task-specific operations known to be supported.                                |
| Does completing every returned information request resume review automatically, or is another verification call required? | Follow the observed status from refetch; do not issue a second verification automatically. |
| What replaces deprecated `addAttestations` and on what timeline?                                                          | Keep the compatibility path isolated and provider-gated.                                   |
| Is `outstanding` always calculated from the proposed party state?                                                         | Treat this as observed, not contractual, until confirmed.                                  |

## Maintenance Rules For This File

1. Record the date, evidence, and confidence for each new finding.
2. Distinguish API behavior, published guidance, implementation policy, and UX choice.
3. Do not present a single environment observation as a universal API guarantee.
4. Link a focused test when the implementation depends on the finding.
5. Mark superseded decisions instead of silently deleting their rationale.
6. Update the baseline commit whenever the canonical recipe is resynchronized with its authoritative source.
