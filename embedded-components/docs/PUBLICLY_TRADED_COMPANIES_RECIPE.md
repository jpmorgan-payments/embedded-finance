# Publicly Traded Companies UI Recipe

> **Draft - under review.** Confirm current API and policy requirements with your J.P. Morgan representative before enabling a PTC journey for your platform.

## Introduction

This recipe helps developers build an onboarding UI for a publicly traded company (PTC) or a subsidiary of one in the US. It complements the [Digital Onboarding Flow recipe](./DIGITAL_ONBOARDING_FLOW_RECIPE.md), which covers the common client, party, question, document, review, and verification journey. This guide concentrates on what changes when the business is publicly traded; it does not prescribe a page layout or require a particular component library.

The [Publicly traded companies guide](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/publicly-traded-companies) and [Digital Onboarding API reference](https://developer.payments.jpmorgan.com/api/commerce/optimization-protection/digital-onboarding/digital-onboarding) define the supported contract. Check them for the current exchange list, field constraints, and eligibility before shipping.

### How to read this recipe

- **Must** statements follow from the API data model or protect the integrity of submitted data.
- **Recommended** statements describe one useful way to guide a customer through the journey. Adapt the screens and wording to your product.

## Journey at a Glance

1. Ask for the business's legal form and whether it is directly traded, a subsidiary of a traded parent, or neither.
2. For a PTC or subsidiary, collect the traded company's primary listing: ticker and exchange. For a subsidiary, these are the **parent PTC's** listing details, not the subsidiary's.
3. Save the organization party, then reread the client and its outstanding requirements.
4. Collect the controller, any required beneficial owners, questions, documents, and attestations. Do not infer all of these requirements from the exchange alone.
5. Review the chosen classification and listing alongside the rest of the onboarding data, submit for verification, and respond to any subsequent information requests.

The host may collect these details during client creation or add them to an in-progress organization party. The user-facing sequence can be a single form or multiple steps.

## Collect the Classification

**Recommended:** ask one mutually exclusive question with answers equivalent to **publicly traded**, **subsidiary of a publicly traded company**, and **neither**. Ask it only for legal forms for which your integration supports PTC onboarding. Sole proprietorship is not a PTC or PTC subsidiary. A legal form's availability in a UI is not proof of eligibility for every product or jurisdiction.

**Must:** distinguish a directly traded business from a subsidiary when constructing the request. A subsidiary's `organizationDetails.isSubsidiary` is `true`; a directly traded company's is `false`. Both supply `organizationDetails.publiclyTraded`. The API requires these two fields together: for “neither,” omit **both** `isSubsidiary` and `publiclyTraded` rather than sending `isSubsidiary: false` alone.

**Must:** do not assume an empty or missing `publiclyTraded` object proves the person previously answered “neither.” The API response does not persist the UI's three-way answer as such. On a returning journey, ask again if a definite answer is needed and you have not saved it in your own application state.

**Recommended:** make the consequences of the selection clear before saving. The party update API does not support removing a saved `publiclyTraded` block. Do not present a working PTC-to-non-PTC switch unless your integration has an explicitly supported correction path. Allow correction of listing details only where the current API permits it; handle rejected updates without silently changing the displayed classification.

## Collect and Submit Listing Details

**Must:** require a ticker symbol and stock exchange when the business is a PTC or subsidiary. For `stockExchange: "Other"`, also collect `stockExchangeName`. Use the exact case-sensitive exchange code from the current API guidance when one is available; do not send the display label in its place. Validate against the current API field constraints and show field-level API errors to the user.

**Recommended:** present NYSE (`XNYS`) and NASDAQ (`XNAS`) prominently, offer the supported exchanges in a searchable list, then offer `Other` with a free-text exchange name. For multiple listings, follow the API's priority order: NYSE or NASDAQ first, then a listed supported exchange, then `Other`. Do not turn a static UI list into an assertion that every listed exchange qualifies for the same due diligence treatment.

These are **organization-party fragments**, not complete create or update requests. Supply the other required organization and client fields for your API operation:

```json
{
  "organizationDetails": {
    "isSubsidiary": false,
    "publiclyTraded": {
      "tickerSymbol": "EXAMPLE",
      "stockExchange": "XNYS"
    }
  }
}
```

For a subsidiary, set `isSubsidiary` to `true` and put the **parent's** ticker and exchange in `publiclyTraded`. If the exchange is `Other`, include its `stockExchangeName`. Do not substitute a `PUBLICLY_TRADED_COMPANY` legal-form value for the actual legal form merely to indicate PTC status.

**Must:** after creating or updating the party, refresh `GET /clients/{id}` before deciding which tasks are outstanding. The submitted party response alone is not the full client-level outstanding-work view. If saving fails, retain the entered values and let the customer correct them; do not advance the flow as if the party was updated.

## Adapt the Remaining Onboarding Work

The listing influences the journey, but the customer's answer does not itself grant an exemption. A direct PTC and a subsidiary can have different business-identification requirements even on the same exchange. Do not promise that CIP, beneficial-owner collection, documents, or attestations have been waived simply because a ticker was entered.

**Recommended:** always collect a controller. For an `XNYS` or `XNAS` listing, follow [NYSE and NASDAQ: what you can skip](#nyse-and-nasdaq-what-you-can-skip). For every other listing, collect everything. Later validation can still add requirements, so keep a way to collect more information if the API asks for it.

### NYSE and NASDAQ: what you can skip

These rules match the `OnboardingFlow` component in this repository when `enablePubliclyTradedCompanies` is on.

**When the rules apply:** the saved organization party has `organizationDetails.publiclyTraded.stockExchange` set to exactly `XNYS` (New York Stock Exchange) or `XNAS` (NASDAQ). The rules are the same for a directly traded company and a subsidiary. For a subsidiary, this is the parent's exchange.

| Details                                                | US PTC<br>(trading on NYSE, NASDAQ)                         | US subsidiary of PTC<br>(trading on NYSE, NASDAQ)           | PTC<br>(trading elsewhere) | Subsidiary of PTC<br>(trading elsewhere) |
| ------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- | -------------------------- | ---------------------------------------- |
| Collect business information                           | **Yes**                                                     | **Yes**                                                     | **Yes**                    | **Yes**                                  |
| Collect beneficial owner information (ownership ≥ 25%) | No                                                          | No                                                          | **Yes**                    | **Yes**                                  |
| Collect controller information                         | **Yes**<br>(government ID and date of birth not required)   | **Yes**<br>(government ID and date of birth not required)   | **Yes**                    | **Yes**                                  |

"US" in this table refers to the NYSE or NASDAQ listing. The rules do not depend on the business's country of formation.

**You do not need to collect:**

- Beneficial owners. Do not show an owners step, and do not create `BENEFICIAL_OWNER` parties, either direct or indirect.
- The controller's date of birth.
- The controller's government ID (SSN, ITIN, or any other ID type).

**You must still collect:**

- One controller with the `CONTROLLER` role, including legal name, job title, country of residence, email, phone, and residential address. Do not also give the controller the `BENEFICIAL_OWNER` role.
- All business details: business identity (including EIN), industry, and business contact details.
- Every question, document request, and attestation in the API's `outstanding` response. Do not hide any of these because of the exchange. The API is expected not to request the FinCEN attestation for `XNYS` or `XNAS`, but if it is returned, show it.

**For every other exchange, collect everything.** This includes other US exchanges such as NYSE Arca (`ARCX`), NYSE Chicago (`XCHI`), and Cboe (`XCBO`), all non-US exchanges, and `Other`. Collect beneficial owners (25% or more ownership) and the controller's date of birth and government ID, the same as for a company that is not publicly traded.

**When to switch:** apply these rules only after the organization party has been saved with the listing and you have reread the client. Do not skip steps based on unsaved form values.

**Must:** follow the API's returned outstanding question IDs, document requests, and attestation document IDs. Do not hardcode a PTC-specific list or discard additional questions because the customer selected PTC. A PTC can also have another business classification that requires additional due diligence.

**Recommended:** show the classification and the traded company's ticker and exchange in the onboarding summary and final review. When the customer is a subsidiary, label the listing as its parent's. Recalculate visible tasks after a classification or exchange change, and preserve any already collected data until the API confirms which requirements apply.

See the [Digital Onboarding Flow recipe](./DIGITAL_ONBOARDING_FLOW_RECIPE.md) for the general handling of controller and owner parties, outstanding questions, document uploads, attestations, review, and verification.

## Verification and Follow-Up

**Must:** do not equate saving listing data with a verified PTC designation or an approved client. Submit onboarding through the normal verification flow only after required work is complete. Continue to read the client status and outstanding requirements; if information is requested, provide the requested completion path rather than treating the earlier PTC selection as final.

**Recommended:** explain that eligibility and any simplified due diligence are subject to validation. Provide a clear route for a customer whose stated listing or subsidiary status cannot be confirmed to supply the additional details requested through the standard onboarding process. Avoid promising an automatic exemption, a fixed review time, or a specific back-office outcome.

## Suggested UI Checks

| Scenario                                | Check                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Direct PTC on NYSE or NASDAQ            | Save `isSubsidiary: false` with `XNYS`/`XNAS`; collect the controller's name, job title, and contact details; skip beneficial owners and the controller's date of birth and government ID; refresh outstanding work. |
| Subsidiary of a listed PTC              | Save `isSubsidiary: true` with the parent's ticker and exchange; apply the same NYSE/NASDAQ relaxation when the parent's exchange is `XNYS`/`XNAS`; show the relationship accurately in review. |
| Other supported exchange                | Collect beneficial owners and the controller's date of birth and government ID, including for other US exchanges such as `ARCX` or `XCBO`; follow the returned requirements. |
| Exchange not in the list                | Require the exchange name with `stockExchange: "Other"`.                                                       |
| Neither / ineligible legal form         | Omit both `isSubsidiary` and `publiclyTraded`; do not show PTC-only fields.                                    |
| Returning client with saved PTC data    | Restore the classification from `publiclyTraded` plus `isSubsidiary`; prevent an unsupported removal.          |
| Returning client without saved PTC data | Do not silently assume a previously answered “neither.”                                                        |
| Save fails or outstanding work changes  | Keep the inputs, show the error, reread the client after successful retry, and update the tasks.               |

## Known Limitations

- `XNYS` and `XNAS` alone do not define every eligible listing or due diligence path. Check current product guidance before applying a streamlined journey to other exchanges.
- In `OnboardingFlow`, the relaxation depends only on the exchange code. The owners section and controller identity-document step stay hidden for `XNYS`/`XNAS` even if the API later asks for owner or controller identity information, so those requests need another completion path.
- The current organization-party response has `isSubsidiary` and `publiclyTraded` but no persisted three-way PTC answer. A “neither” choice may need host-side session state on a return visit.
- The party update API does not support removal of previously saved PTC data. Resolve a mistaken classification through a supported process with your J.P. Morgan representative rather than sending an empty block or implying a customer can undo it in the UI.
- Policy and API guidance can evolve independently of a static exchange picker. Reconfirm the available exchanges, legal forms, and due diligence paths when integrating or updating this journey.
