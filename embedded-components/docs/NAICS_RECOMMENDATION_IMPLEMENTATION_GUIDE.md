# NAICS Code Recommendation Implementation Guide

> **⚠️ PRE-RELEASE / DEVELOPMENT VERSION ⚠️**  
> This guide is currently in development. API endpoints, response formats, and implementation details are subject to change.

## Table of Contents

- [1. Overview](#1-overview)
- [2. API Implementation](#2-api-implementation)
- [3. Frontend Implementation](#3-frontend-implementation)
- [4. Error Handling](#4-error-handling)
- [5. Implementation Example](#5-implementation-example)

## 1. Overview

The NAICS (North American Industry Classification System) Recommendation API helps users select appropriate industry codes during the onboarding process by providing AI-powered suggestions based on business descriptions. This guide outlines how to implement this feature in your application.

### Key Benefits

- Improves user experience by suggesting relevant industry codes
- Eliminates the need to maintain static NAICS code tables
- Reduces onboarding delays caused by incorrect industry selection
- Improves straight-through processing during customer onboarding

## 2. API Implementation

### API Endpoint

The recommendation engine is accessed through the following endpoint:

```http
POST /recommendations
```

### Request Format

```json
{
  "resourceType": "NAICS_CODE",
  "values": [
    {
      "key": "organizationDescription",
      "value": "We specialize in solar panel installation for homes"
    }
  ]
}
```

### Response Format

### Successful Response (With Recommendations)

```json
{
  "resourceType": "NAICS_CODE",
  "message": "",
  "resource": [
    {
      "naicsCode": "238210",
      "naicsDescription": "Electrical Contractors and Other Wiring Installation Contractors"
    },
    {
      "naicsCode": "238220",
      "naicsDescription": "Plumbing, Heating, and Air-Conditioning Contractors"
    }
  ]
}
```

### Successful Response (No Recommendations)

```json
{
  "resourceType": "NAICS_CODE",
  "message": "Your organization description is too vague to suggest relevant industry classifications. Please provide more specific details about your business activities.",
  "resource": []
}
```

## 3. Frontend Implementation

For implementing the NAICS recommendation feature in your frontend application, we recommend following these steps:

1. **Create a custom hook** for managing the recommendation logic
2. **Implement a UI component** that allows users to:
   - Enter business descriptions
   - Request industry recommendations
   - View and select from recommended industries

### Recommended Implementation Pattern

1. **Custom hook for recommendation logic**:
   - Handle API requests to the recommendations endpoint
   - Manage loading states during API calls
   - Process and format recommendation responses
   - Handle error scenarios gracefully

2. **UI Component requirements**:
   - Text field for business description
   - "Suggest" button to trigger recommendations
   - Loading indicator while recommendations are being generated
   - Clear display of recommended industries with codes
   - Warning messages for empty or error responses
   - Easy selection of recommended industries

## 4. Error Handling

Your implementation should handle these common scenarios:

1. **Vague business description**: Display user-friendly guidance about improving the description
2. **API errors**: Show appropriate error messages without exposing technical details
3. **Rate limiting**: Inform users when they've exceeded request limits (max 3 per session, 1 per 10 seconds)
4. **Empty responses**: Handle cases where no recommendations are returned

## 5. Implementation Example

Below is an example of how we've implemented this feature in our embedded components library.

### Custom Hook (useIndustrySuggestions)

The hook manages all recommendation-related logic, including:

- API requests using React Query
- State management for recommendations
- Error handling for API failures
- Feature flag management for enabling/disabling the feature

For reference implementation, please examine the following files in our codebase:

1. **useIndustrySuggestions.ts** - A custom React hook that handles:
   - API communication with the recommendations endpoint
   - State management for recommendations, loading states, and errors
   - Feature flag management
   - Error handling and user feedback

2. **IndustryForm.tsx** - A form component that:
   - Utilizes the useIndustrySuggestions hook
   - Displays a business description input field
   - Provides a "Suggest" button to trigger recommendations
   - Shows a loading indicator during API requests
   - Renders recommended industries in a user-friendly format
   - Handles error scenarios with appropriate messaging

For more detailed implementation guidance, refer to our example files:

- `useIndustrySuggestions.ts`: Custom hook implementation
- `IndustryForm.tsx`: UI component implementation

## Rate Limiting Considerations

The API implements the following rate limits:

- Maximum three requests per session
- Maximum one request every 10 seconds

Your implementation should respect these limits and provide appropriate feedback to users when limits are exceeded.
