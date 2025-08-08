# Requirements Document

## Introduction

The Embedded Finance Solutions Onboarding Explorer is an interactive tool that helps platform developers quickly integrate client onboarding APIs, reducing time to first integration and simplifying documentation/OpenAPI Specification research. The tool provides a visual journey mapping experience that shows required API operations, payload attributes, and documentation based on user-selected criteria (product type, jurisdiction, and legal entity type). This tool aims to accelerate the onboarding process by providing clear, contextual guidance and reducing integration complexity.

## Requirements

### Requirement 1

**User Story:** As a developer integrating with Embedded Finance Solutions APIs, I want to select my specific onboarding criteria (product, jurisdiction, legal entity type) so that I can see only the relevant API requirements for my use case.

#### Acceptance Criteria

1. WHEN a user accesses the tool THEN the system SHALL display selection controls for product type, jurisdiction, and legal entity type
2. WHEN a user selects a product type THEN the system SHALL show available options from the ClientProduct enum (EMBEDDED_PAYMENTS, MERCHANT_SERVICES)
3. WHEN a user selects a jurisdiction THEN the system SHALL show available country options (US, CA, etc.)
4. WHEN a user selects a legal entity type THEN the system SHALL show available organization types from the API specification
5. WHEN all required criteria are selected THEN the system SHALL enable the journey visualization

### Requirement 2

**User Story:** As a developer, I want to see a visual representation of the API journey for my selected criteria so that I can understand the sequence of operations and decision points.

#### Acceptance Criteria

1. WHEN criteria are selected THEN the system SHALL display a visual flow diagram showing the API operations sequence
2. WHEN the journey is displayed THEN the system SHALL show success and failure branches for each operation
3. WHEN the journey is displayed THEN the system SHALL use ReactFlow or similar library for interactive visualization
4. WHEN a user hovers over an operation node THEN the system SHALL show basic operation information
5. WHEN no operation is selected THEN the system SHALL show a comprehensive table of all API attributes

### Requirement 3

**User Story:** As a developer, I want to download or review the Arazzo specification for my selected journey so that I can implement the workflow programmatically.

#### Acceptance Criteria

1. WHEN a journey is displayed THEN the system SHALL provide a download option for the corresponding Arazzo specification
2. WHEN the download is requested THEN the system SHALL serve the pre-created Arazzo YAML file for the specific criteria combination
3. WHEN the Arazzo spec is not available THEN the system SHALL display an appropriate message
4. WHEN viewing the journey THEN the system SHALL provide a preview option to review Arazzo specification details

### Requirement 4

**User Story:** As a developer, I want to see all required payload attributes organized by API operation and logical grouping so that I can understand what data I need to collect.

#### Acceptance Criteria

1. WHEN no specific operation is selected THEN the system SHALL display a table with all POST payload attributes
2. WHEN displaying attributes THEN the system SHALL group them by API operation name
3. WHEN displaying attributes THEN the system SHALL show JSON path within the payload for each attribute
4. WHEN displaying attributes THEN the system SHALL provide logical grouping (e.g., personal info, business info, addresses)
5. WHEN an attribute has a description THEN the system SHALL display it in the description field
6. WHEN an attribute is required THEN the system SHALL clearly indicate its required status

### Requirement 5

**User Story:** As a developer, I want to select a specific API operation node to see filtered attributes and detailed step information so that I can focus on one operation at a time.

#### Acceptance Criteria

1. WHEN a user clicks on an API operation node THEN the system SHALL filter the attribute table to show only that operation's attributes
2. WHEN an operation is selected THEN the system SHALL display Arazzo-specific step properties in a visual format
3. WHEN an operation is selected THEN the system SHALL show step dependencies, parameters, and success criteria
4. WHEN an operation is selected THEN the system SHALL provide tab navigation between table view and JSON payload view
5. WHEN viewing JSON payload THEN the system SHALL show only required fields for the selected workflow criteria

### Requirement 6

**User Story:** As a developer, I want to switch between table and JSON payload views for selected operations so that I can see the data in my preferred format.

#### Acceptance Criteria

1. WHEN an API operation is selected THEN the system SHALL provide tab controls for "Table View" and "JSON Payload"
2. WHEN "JSON Payload" tab is selected THEN the system SHALL display a formatted JSON structure with only required fields
3. WHEN "Table View" tab is selected THEN the system SHALL display the filtered attribute table
4. WHEN switching between views THEN the system SHALL maintain the current operation selection
5. WHEN displaying JSON payload THEN the system SHALL highlight required vs optional fields differently
6. WHEN an API operation is selected THEN the system SHALL provide a special side-by-side mode displaying both JSON payload and table view simultaneously to map each attribute

### Requirement 7

**User Story:** As a developer, I want the tool to be extensible for additional criteria types so that new selection parameters can be added over time.

#### Acceptance Criteria

1. WHEN new criteria types are needed THEN the system SHALL support adding them without major architectural changes
2. WHEN criteria are extended THEN the system SHALL maintain backward compatibility with existing Arazzo mappings
3. WHEN new criteria are added THEN the system SHALL update the mapping configuration accordingly
4. WHEN criteria combinations increase THEN the system SHALL handle the mapping efficiently

### Requirement 8

**User Story:** As a developer, I want to see clear visual indicators for required vs optional fields and success/failure paths so that I can understand the critical vs nice-to-have elements.

#### Acceptance Criteria

1. WHEN displaying API attributes THEN the system SHALL use visual indicators (icons, colors) to distinguish required from optional fields
2. WHEN showing the journey flow THEN the system SHALL use different visual styles for success and failure paths
3. WHEN an operation can fail THEN the system SHALL clearly show failure conditions and next steps
4. WHEN displaying step information THEN the system SHALL highlight critical vs informational properties
5. WHEN showing validation requirements THEN the system SHALL clearly indicate field constraints and formats
