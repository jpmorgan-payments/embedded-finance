# Implementing an Incremental Document Upload Experience

> **Note**: This document is a work in progress and subject to change.

## Overview

The document upload process can be simplified by using an incremental approach that guides users through requirements step-by-step, while still providing visibility of the overall process. This represents one possible approach to consuming the document upload API through a user interface.

## User Flow with Client-Side State Management

```mermaid
sequenceDiagram
    participant User
    participant UI Display
    participant UI State
    participant API

    API->>UI Display: Load document request with outstanding requirements
    Note over UI Display: Show all outstanding requirements, but only first is interactive
    UI Display->>User: Display all requirements (first active, others disabled)

    User->>UI Display: Select document type & upload for first requirement
    UI Display->>UI State: Update satisfied requirements
    UI State->>UI Display: Re-evaluate active requirements
    UI Display->>API: Upload document (sync or async)

    Note over UI State: Client-side requirement evaluation based on missing count

    UI State->>UI Display: Activate next requirement if any still missing
    UI Display->>User: Enable interaction with next requirement

    User->>UI Display: Select document type & upload for next requirement
    UI Display->>UI State: Update satisfied requirements
    UI State->>UI Display: Re-evaluate active requirements
    UI Display->>API: Upload document (sync or async)

    UI State->>UI Display: All requirements satisfied
    UI Display->>User: Enable submission
    User->>UI Display: Submit all documents
    UI Display->>API: Submit document request
```

## Implementation Details

### State Management

- **Active Requirements**: Track which requirements are currently interactive using a state object mapping document request IDs to arrays of active requirement indices.
- **Satisfied Document Types**: Maintain a list of document types that have been satisfied to prevent duplicate uploads.
- **Form State**: Use React Hook Form with dynamic Zod validation schemas that adapt based on active requirements and missing document counts.

### Key Implementation Patterns

1. **Progressive Disclosure**:

   - Show all outstanding requirements but make only active ones interactive
   - Activate them sequentially as previous ones are completed
   - Base requirement completion on the `missing` count from the API

2. **Client-Side Validation**:

   - Watch form values to evaluate requirement satisfaction
   - Use `outstanding.requirements` to determine what documents are still needed
   - Track progress based on the `missing` count for each requirement

3. **Document Processing**:

   - Convert files to base64
   - Upload with unique IDs
   - Process asynchronously
   - Update UI based on outstanding requirements after each upload

4. **Multi-Party Support**:

   - Handle document requests for multiple parties with appropriate filtering and display
   - Track outstanding requirements per party

5. **UI Considerations**:
   - Show clear progress indicators based on missing document counts
   - Display already satisfied requirements in a completed state
   - Provide visual feedback for remaining required documents
   - Implement appropriate validation based on outstanding requirements

### API State Integration

The component now relies on the API's `outstanding` field to determine:

1. Which requirements still need documents
2. How many documents are missing for each requirement
3. What document types are still acceptable

```typescript
interface DocumentRequestOutstanding {
  documentTypes: DocumentTypeSmbdo[];
  requirements: {
    documentTypes: DocumentTypeSmbdo[];
    missing: number;
  }[];
}
```

This pattern creates an intuitive experience by:

1. Giving users visibility of the entire process
2. Guiding them through each step in a controlled manner
3. Accurately reflecting the current state of document requirements
4. Preventing duplicate uploads of already satisfied requirements

While this implementation uses React Hook Form and client-side state management, other approaches to consuming the API are possible depending on specific requirements.
