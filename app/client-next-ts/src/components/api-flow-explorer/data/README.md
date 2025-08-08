# Data Directory

This directory contains the configuration and specification files for the API
Flow Explorer:

## Configuration Files

### `criteria-mapping.json`

Main configuration file that maps onboarding criteria combinations to their
corresponding Arazzo workflow specifications. Contains:

- **mappings**: Object mapping criteria keys (format:
  `PRODUCT-JURISDICTION-ENTITY_TYPE`) to workflow configurations
- **defaultCriteria**: Default selection when the component loads
- **supportedCombinations**: Array of valid criteria combination keys
- **validationRules**: Rules for validating criteria combinations
- **metadata**: Version and description information

### Supported Criteria Combinations

Currently supported combinations:

- `EMBEDDED_PAYMENTS-US-LLC`: US LLC using Embedded Payments
- `EMBEDDED_PAYMENTS-US-CORPORATION`: US Corporation using Embedded Payments
- `EMBEDDED_PAYMENTS-CA-CORPORATION`: Canadian Corporation using Embedded
  Payments
- `MERCHANT_SERVICES-US-LLC`: US LLC using Merchant Services
- `MERCHANT_SERVICES-CA-CORPORATION`: Canadian Corporation using Merchant
  Services

## Arazzo Specifications

### `arazzo-specs/` Directory

Contains Arazzo workflow specification files that define the step-by-step
onboarding processes:

- `embedded-payments-us-llc.yaml`: Workflow for US LLC Embedded Payments
  onboarding
- `embedded-payments-us-corporation.yaml`: Workflow for US Corporation Embedded
  Payments onboarding
- `embedded-payments-ca-corporation.yaml`: Workflow for Canadian Corporation
  Embedded Payments onboarding
- `merchant-services-us-llc.yaml`: Workflow for US LLC Merchant Services
  onboarding
- `merchant-services-ca-corporation.yaml`: Workflow for Canadian Corporation
  Merchant Services onboarding

Each Arazzo file defines:

- Workflow steps and their dependencies
- API operation mappings
- Success/failure criteria
- Error handling procedures
- Required parameters and payloads

## API Specifications

### `api-specs/` Directory

Contains OpenAPI specification files that define the available API operations.
These are referenced by the Arazzo workflows to provide detailed operation
information.

## Usage

The configuration system is accessed through the `ConfigLoader` utility class,
which provides:

- Configuration loading and validation
- Criteria combination validation
- Mapping retrieval for specific criteria
- Available options enumeration
- Error handling for missing or invalid configurations

Example usage:

```typescript
import { configLoader } from '../utils/configLoader';

// Load and validate configuration
const config = await configLoader.loadConfig();

// Check if criteria combination is supported
const isSupported = await configLoader.isCombinationSupported({
  product: 'EMBEDDED_PAYMENTS',
  jurisdiction: 'US',
  legalEntityType: 'LLC',
});

// Get mapping for specific criteria
const mapping = await configLoader.getMappingForCriteria(criteria);
```
