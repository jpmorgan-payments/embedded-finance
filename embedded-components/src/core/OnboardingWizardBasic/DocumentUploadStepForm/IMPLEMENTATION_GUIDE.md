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

    API->>UI Display: Load document request with all requirements
    Note over UI Display: Show all requirements, but only first is interactive
    UI Display->>User: Display all requirements (first active, others disabled)

    User->>UI Display: Select document type & upload for first requirement
    UI Display->>UI State: Update satisfied requirements
    UI State->>UI Display: Re-evaluate active requirements
    UI Display->>API: Upload document (async)

    Note over UI State: Client-side requirement evaluation

    UI State->>UI Display: Activate next requirement
    UI Display->>User: Enable interaction with next requirement

    User->>UI Display: Select document type & upload for next requirement
    UI Display->>UI State: Update satisfied requirements
    UI State->>UI Display: Re-evaluate active requirements
    UI Display->>API: Upload document (async)

    UI State->>UI Display: All requirements satisfied
    UI Display->>User: Enable submission
    User->>UI Display: Submit all documents
    UI Display->>API: Submit document request
```

## Implementation Details

### State Management

- **Active Requirements**: Track which requirements are currently interactive using a state object mapping document request IDs to arrays of active requirement indices.
- **Satisfied Document Types**: Maintain a list of document types that have been satisfied to prevent duplicate uploads.
- **Form State**: Use React Hook Form with dynamic Zod validation schemas that adapt based on active requirements.

### Key Implementation Patterns

1. **Progressive Disclosure**: Show all requirements but make only active ones interactive, activating them sequentially as previous ones are completed.

2. **Client-Side Validation**: Watch form values to evaluate requirement satisfaction and update UI accordingly.

3. **Document Processing**: Convert files to base64, upload with unique IDs, and process asynchronously.

4. **Multi-Party Support**: Handle document requests for multiple parties with appropriate filtering and display.

5. **UI Considerations**: Provide visual indicators of completion status and implement appropriate validation.

This pattern creates an intuitive experience by giving users visibility of the entire process while guiding them through each step in a controlled manner. While this implementation uses React Hook Form and client-side state management, other approaches to consuming the API are possible depending on specific requirements.
