# Request for Information (RFI) UI Recipe

## Introduction

During onboarding, and at any point after approval, J.P. Morgan may need more information about a client or one of its related parties to complete Know Your Customer (KYC) or Customer Identification Program (CIP) checks. This is a **Request for Information (RFI)**. An RFI asks for:

- **Documents**, for example a driver's license, a passport, or articles of incorporation.
- **Answers to questions**, for example a detailed business description or employment history.

This recipe covers how to detect an RFI, show what is being asked, and fulfill it through the API, and how the `OnboardingFlow` component in this repository handles it. It does not prescribe a page layout.

### How to read this recipe

- **Must** statements follow from the API contract or protect the integrity of submitted data.
- **Recommended** statements describe one useful way to guide the user. Adapt them to your product.

### References

- [Digital Onboarding API reference](https://developer.payments.jpmorgan.com/api/commerce/optimization-protection/digital-onboarding/digital-onboarding)
- [Upload documents](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/upload-documents) and the [Document upload form recipe](./DOCS_UPLOAD_FORM_RECIPE.md)
- [Webhook integration recipe](./WEBHOOK_INTEGRATION_RECIPE.md)

## When an RFI Happens

| Scenario                                  | Client status while the RFI is open | Client status once it is fulfilled |
| ----------------------------------------- | ----------------------------------- | ---------------------------------- |
| Raised during onboarding (in review)      | `INFORMATION_REQUESTED`             | `REVIEW_IN_PROGRESS`               |
| Raised after onboarding (client approved) | `APPROVED`                          | `APPROVED`                         |

In both cases your platform receives a `CLIENT_ONBOARDING` webhook with `hasOutstandingInformation: true` when the request is raised, and another with `hasOutstandingInformation: false` once every item has been fulfilled:

```json
{
  "eventId": "905",
  "eventType": "CLIENT_ONBOARDING",
  "resourceType": "CLIENTS",
  "resource": "{\"id\":\"3000005555\",\"status\":\"INFORMATION_REQUESTED\",\"hasOutstandingInformation\":true,\"customerIdentityStatus\":\"INFORMATION_REQUESTED\"}"
}
```

**Must:** don't treat `hasOutstandingInformation: true` as "onboarding is blocked". Check the client status: `INFORMATION_REQUESTED` is an onboarding gate, `APPROVED` is a follow-up on an active client.

## Read What Is Being Asked

Call `GET /clients/{id}` and read the `outstanding` object. It can contain any combination of document requests and questions:

```json
{
  "id": "3000005555",
  "status": "INFORMATION_REQUESTED",
  "outstanding": {
    "documentRequestIds": ["68803"],
    "questionIds": ["30200"],
    "attestationDocumentIds": []
  }
}
```

For each ID:

- **Document requests:** `GET /document-requests/{id}` returns the description and requirements (document types, minimum count).
- **Questions:** `GET /questions/{id}` (or `GET /questions?questionIds=...` for several) returns the question text and its `responseSchema` (value type, allowed values, length limits, and item counts). A question can list conditional `subQuestions` that only apply for certain answers.

**Must:** build the task list from the `outstanding` object, not from a fixed list. One RFI can contain documents, questions, or both, and each item is tracked on its own.

**Recommended:** refetch the client when you receive the webhook, when the user returns to your page, and after each save. The webhook only tells you that something changed.

## Fulfill a Document Request

Upload each file with `POST /documents`, referencing the document request, then call `POST /document-requests/{id}/submit`. A request can accept several files. Once submitted, it is removed from `outstanding.documentRequestIds`. See [Upload documents](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/upload-documents) for the full contract.

## Answer a Question

Save answers with `PATCH /clients/{id}`, referencing the question IDs from `outstanding`. This applies to questions about the client and about its related parties:

```json
{
  "questionResponses": [
    {
      "questionId": "30200",
      "values": [
        "We provide subscription-based accounting software to small businesses."
      ]
    }
  ]
}
```

A question is fulfilled as soon as its response is recorded. There is no separate submit call.

**Must:** validate each answer against the question's `responseSchema` before sending it, and show field-level API errors next to the matching question.

**Must:** only send answers for questions that apply. If a conditional sub-question is hidden because of its parent's answer, leave it out of the request.

**Must:** after saving, reread the client. An answer can add a follow-up question to `outstanding.questionIds`. Show it rather than treating the request as complete.

**Recommended:** only show the questions in the RFI. Earlier onboarding answers are not part of the request and don't need to be resent.

## Completion

No call is needed to close an RFI. Each item leaves `outstanding` as it is fulfilled, and `hasOutstandingInformation` stays `true` until all of them are done. For an RFI raised in review, the status then returns to `REVIEW_IN_PROGRESS`; the change can arrive after your last save response, so keep refetching rather than relying on that response.

**Recommended:** once everything has been provided, tell the user it was received and that the review team will follow up if they need more. Don't promise an outcome or a review time.

## How `OnboardingFlow` Handles It

The `OnboardingFlow` component in this repository follows the guidance above.

### Overview

- An **Additional information** card appears when questions are outstanding, and a **Supporting documents** card appears when document requests are outstanding. Both open their own screen.
- The alert above the cards names what is still needed: documents, questions, or both.
- `INFORMATION_REQUESTED`: onboarding sections stay locked. Once nothing is outstanding but the status hasn't changed yet, the alert confirms the response was received.
- `APPROVED`: the card heading changes to "We need a few more details" and the green approval banner is replaced by a single informational alert. It confirms the business is still verified and the account stays active, then says what to provide. Once nothing is outstanding, the usual approval heading and banner return.

For approved clients, only `outstanding.documentRequestIds` counts as a document request. Party-level `validationResponse` document request IDs are only used while the client is `INFORMATION_REQUESTED`.

### Questions screen

- Shows only the outstanding questions, using the same field types as the onboarding **Operational details** form (yes/no, select, multi-select, number, date, money). Free-text answers use a multi-line field.
- Enforces `minLength` and `maxLength` from `responseSchema` for free-text answers.
- Sends only visible answers with `PATCH /clients` and maps API validation errors to the matching questions.
- If an answer adds a follow-up question, the screen stays open, shows an alert, and keeps the answered question visible so the follow-up has context.
- Refetches the client after each save. Once nothing is left to answer, it continues to the supporting documents screen if documents are still requested (the submit button says so), and otherwise returns to the overview.

### Supporting documents screen

- When the same request includes questions, a **Questions for you** card links to the questions screen.
- A questions-only request shows that card instead of the "no document requests" error.
- An approved client with requested documents sees them instead of the "no documents required" message.

### Host props and modes

- `docUploadOnlyMode`: the questions screen is also reachable in this mode, and it returns to the supporting documents screen after saving.
- `alertOnExit` / `alertOnPreviousStep`: unsaved-change prompts stay on for an approved client with an open RFI.
- `deltaMode`: delta mode only activates for `NEW` clients. Outstanding questions on a submitted client always belong to an RFI, so they never appear in the delta panel.

### Storybook

- **Core → OnboardingFlow → Client States**: _Information requested — documents only_, _Information requested — documents + questions_, _Information requested — questions only_, and _Approved — outstanding items (documents + questions)_.
- **Core → OnboardingFlow → DocumentUpload** (`docUploadOnlyMode`): _Information requested — documents + questions_, _Information requested — questions only_, and _Approved — outstanding items (documents + questions)_.
- **Core → OnboardingFlow → Entry points → Flow stages**: _Information requested — supporting documents_ and _Information requested — additional information (questions)_ open each screen directly.

Story names start with the client status (`INFORMATION_REQUESTED` or `APPROVED`). An RFI on an approved client never changes its status, so those stories are named for the outstanding items instead.

The stories reuse the onboarding question mock (`efClientQuestionsMock`): the sanctions question `30158`, its free-text follow-up `30162` (outstanding alongside its parent and shown inline once `30158` is answered "Yes"), and the monthly processing volume question `30194`. The mock API returns an `INFORMATION_REQUESTED` client to `REVIEW_IN_PROGRESS` only once every question and document is done, and it keeps an approved client `APPROVED`.

## Suggested UI Checks

| Scenario                                | Check                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Documents and questions in review       | Both tasks shown; status stays `INFORMATION_REQUESTED` until both are done, then `REVIEW_IN_PROGRESS`. |
| Questions answered, documents remaining | After the last answer, the user goes straight to the documents rather than back to the overview.       |
| Questions only                          | No document error shown; answers saved with `PATCH /clients`; no submit call.                          |
| Answer reveals a follow-up              | Follow-up question shown after the save; parent answer still visible.                                  |
| API rejects an answer                   | Error shown on the matching question; entered values kept.                                             |
| RFI after approval                      | Status stays `APPROVED`; requested items shown; nothing shown once they are fulfilled.                 |
| Returning with an RFI already answered  | Only items still in `outstanding` are shown.                                                           |

## Known Limitations

- `hasOutstandingInformation` is sent on the webhook but is not part of the `GET /clients` response. `OnboardingFlow` refetches the client on window focus, every 60 seconds, and after each save. To show a new RFI immediately after the webhook, remount the component or refetch the client on your side.
- The UI can't tell which party a question is about. Questions about the client and its related parties appear in one list; the question text should say who it concerns.
- The **Additional information** step only shows as completed in the sidebar for the session in which the user answered the questions. After a reload, a fulfilled RFI simply has no outstanding questions.
- For an approved client, every item in `outstanding.questionIds` and `outstanding.documentRequestIds` is treated as part of an RFI.
