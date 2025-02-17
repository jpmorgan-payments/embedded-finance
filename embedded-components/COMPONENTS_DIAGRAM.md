# Embedded Finance Components Architecture Overview

Below is a mermaid diagram representing the key components and file structure related to the Embedded Finance Components project, with special focus on the OnboardingWizardBasic and EBComponentsProvider components.

```mermaid
graph LR;
    %% Root Structure
    A[embedded-components/] --> B[README.md]
    A --> C[src/]
    A --> G[.storybook/]
    A --> J[.demo/]
    A --> M[components.json]
    A --> N[orval.config.cjs]
    A --> O[package.json]
    A --> P[docs/]

    %% Core Components
    C --> CORE[src/core/]
    
    %% OnboardingWizardBasic Structure
    CORE --> OWB[OnboardingWizardBasic/]
    OWB --> OWB1[OnboardingContextProvider/]
    OWB --> OWB2[InitialStepForm/]
    OWB --> OWB3[IndividualStepForm/]
    OWB --> OWB4[BeneficialOwnerStepForm/]
    OWB --> OWB5[DecisionMakerStepForm/]
    OWB --> OWB6[DocumentUploadStepForm/]
    OWB --> OWB7[FormActions.tsx]
    OWB --> OWB8[index.ts]

    %% Step Form Internal Structure Example
    OWB2 --> SF1[InitialStepForm.tsx]
    OWB2 --> SF2[InitialStepForm.schema.ts]
    OWB2 --> SF3[InitialStepForm.test.tsx]
    OWB2 --> SF4[InitialStepForm.story.tsx]
    
    %% EBComponentsProvider Structure
    CORE --> ECP[EBComponentsProvider/]
    ECP --> ECP1[config.types.ts]
    ECP --> ECP2[defaultTheme.ts]
    ECP --> ECP3[ErrorBoundary.tsx]
    ECP --> ECP4[ContentTokensProvider.tsx]
    ECP --> ECP5[EBComponentsProvider.tsx]
    ECP --> ECP6[index.ts]

    %% API Layer
    C --> D[api/]
    D --> E[generated/]
    D --> F[axios-instance.ts]

    %% Documentation
    P --> DOC1[Digital Onboarding Recipe]
    P --> DOC2[Linked Accounts Recipe]
    P --> DOC3[API Implementation Guide]

```

## Component Architecture Explanation

### 1. OnboardingWizardBasic
Key component for handling digital onboarding flows with the following structure:

- **OnboardingContextProvider/**
  - Manages global onboarding state
  - Handles client configuration (clientId, partyId, jurisdictions, etc.)
  - Provides context for step management

- **Individual Step Components/**
  Each step component (InitialStepForm, IndividualStepForm, etc.) follows a consistent structure:
  - `StepName.tsx`: Main component implementation
  - `StepName.schema.ts`: Zod validation schema
  - `StepName.test.tsx`: Component tests
  - `StepName.story.tsx`: Storybook documentation

- **FormActions.tsx**
  - Controls step navigation
  - Handles form submission
  - Manages loading and disabled states

### 2. EBComponentsProvider
Core provider component that configures the application environment:

- **config.types.ts**
  - Defines configuration interface
  - API configuration types
  - Theme customization options
  - Header management types

- **defaultTheme.ts**
  - Default theme configuration
  - Color scheme definitions
  - Typography settings
  - Spacing and layout variables

- **ErrorBoundary.tsx**
  - Global error handling
  - Fallback UI components
  - Error logging and reporting

- **ContentTokensProvider.tsx**
  - Internationalization support
  - Custom content management
  - Token override capabilities

### Supporting Structure

- **api/**
  - Generated API clients
  - Axios configuration
  - Type definitions

- **.storybook/**
  - Component documentation
  - Interactive examples
  - Development environment

- **docs/**
  - Implementation recipes
  - Best practices
  - Integration guides
