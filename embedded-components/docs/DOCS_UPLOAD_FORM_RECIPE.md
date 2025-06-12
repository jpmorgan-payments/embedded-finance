# Document Upload Form Implementation Guide

## Overview

A guided document upload component that enables users to fulfill document requirements in a step-by-step interface. Handles both required and optional documents, with support for multiple parties.

## Document Flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant UI
    participant UI State
    participant API

    UI->>API: Load document request (ACTIVE status)
    Note over API, UI: API GET /document-requests?clientId={id}&includeRelatedParties=true<br/>OR API GET /clients/{id} -> API GET /document-requests/{id}
    Note over UI: Show all requirements as steps<br/>Only first one interactive

    alt manage/render requirements state via UI State (recommended)
      User->>UI: Upload document for requirement
      UI->>UI State: Update satisfied docs
      UI State->>UI: Activate next requirement

      Note over UI State: Evaluate based on minRequired

      UI State->>UI: All requirements met
      UI->>User: Enable submission
      User->>UI: Submit

      UI->>API: Upload document (sync)
      Note over API, UI: API POST /documents
    else manage/render requirements state via API state
      loop for each requirement/document
        UI->>API: Upload document (sync)
        Note over API, UI: API POST /documents

        UI->>API: re-fetch document-request and re-render the requirements/form based on the outstanding requirements API GET /document-requests/{id}
        Note over UI: re-render the requirements/form based on the outstanding block
      end
    end

    UI->>API: Submit document request
    Note over API, UI: API POST /document-requests/{id}/submit
```

## Key Features

- Progressive disclosure of requirements
- Real-time validation
- Multi-party support
- Optional document handling (minRequired = 0)
- Status-aware processing (ACTIVE/CLOSED/EXPIRED)

## Document Requirements Structure

```typescript
interface DocumentRequest {
  id: string;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  requirements: {
    documentTypes: DocumentTypeSmbdo[];
    minRequired: number; // 0 for optional, ≥1 for required
  }[];
}
```

## Implementation Notes

### State Management

- Uses root `requirements` instead of `outstanding` for complete visibility
- Tracks active requirements and satisfied document types
- Dynamic form validation based on `minRequired` counts

### Document Processing

- Async file uploads with unique request IDs
- Base64 encoding for document content
- Supports multiple uploads of same document type
- Only processes ACTIVE document requests

### UI Behavior

1. **Required Documents** (minRequired ≥ 1):

   - Sequential activation of requirements
   - Asterisk (\*) indicator
   - Must be satisfied for form submission

2. **Optional Documents** (minRequired = 0):
   - "Optional" badge and labels
   - No asterisk
   - Not required for form submission

## Testing Scenarios

### Organization Documents

```typescript
{
  requirements: [{
    documentTypes: ['ARTICLES_OF_INCORPORATION', 'LLC_AGREEMENT', ...],
    minRequired: 1
  }]
}
```

### Individual Documents

```typescript
{
  requirements: [
    {
      documentTypes: ['PASSPORT', 'DRIVERS_LICENSE'],
      minRequired: 1
    },
    {
      documentTypes: ['BANK_STATEMENT', 'UTILITY_BILL', ...],
      minRequired: 0
    }
  ]
}
```

## Key Test Cases

1. Status handling (ACTIVE/CLOSED/EXPIRED)
2. Required vs optional document flows
3. Multi-party document requests
4. Sequential requirement activation
5. File upload and validation
6. Error scenarios
