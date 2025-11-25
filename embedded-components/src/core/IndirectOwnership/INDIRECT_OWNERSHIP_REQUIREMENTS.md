# Indirect Ownership Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Digital Onboarding - Beneficial Ownership](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/)
> - [Party Management](https://developer.payments.jpmorgan.co## Current Implementation Status

### Completed Features ✅

- **Two-Tab Interface**: Full Structure and Beneficial Owners views
- **API Integration**: SMBDO API integration with proper error handling and loading states
- **Hierarchical Display**: Accordion-based tree view with parent-child relationships
- **Individual Classification**: Automatic classification of direct vs indirect individual owners
- **Ownership Chain Descriptions**: Text descriptions of ownership paths for indirect owners
- **Interactive Forms**: Multi-step dialogs for adding individuals and intermediary entities
- **Real-time Updates**: Local state management with immediate UI updates
- **Mock Data Integration**: Complex 3-layer ownership structure with realistic scenarios
- **Responsive Design**: Mobile and desktop optimized layouts
- **Compliance Context**: Educational alerts about beneficial ownership requirements

### Technical Implementation ✅

- **Button-based Tabs**: Custom tab implementation without external dependencies
- **TypeScript Integration**: Full type safety with SMBDO schema compliance
- **Storybook Stories**: Multiple scenarios with MSW API mocking
- **Error Handling**: Comprehensive error states and validation
- **Theme Integration**: SELLSENSE_THEME styling consistency
- **Accessibility**: Proper ARIA attributes and keyboard navigation

---

## Success Metrics

### Technical Metrics

- **Performance**: Load ownership structures with 100+ parties efficiently
- **Accuracy**: 99.9% data consistency in ownership classification
- **Reliability**: 99.5% uptime for ownership operations
- **Usability**: Complete ownership entry in <5 minutes for complex structures

### Business Metrics

- **Compliance**: Reduce compliance review time by clearly organizing all individual owners
- **Accuracy**: Decrease ownership classification errors through grouped direct/indirect display
- **Efficiency**: Increase onboarding speed with focused two-tab interface
- **User Satisfaction**: Achieve 4.5/5 user satisfaction rating through intuitive grouped organizationed-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/party-management)
  > **API References:**
  >
  > - [Get Client API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/digital-onboarding/smbdo#/operations/smbdoGetClient)
  > - [Update Client API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/digital-onboarding/smbdo#/operations/smbdoUpdateClient)
  > - [List Questions API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/digital-onboarding/smbdo#/operations/smbdoListQuestions)

---

## Technical Design Philosophy Alignment

### Integration Scenarios

- **Digital Onboarding**: Collect and validate complex ownership structures during client onboarding
- **Compliance Dashboard**: Embedded in compliance portals for beneficial ownership verification
- **KYC/AML Workflows**: Support for regulatory compliance requirements
- **Corporate Structure Management**: Manage multi-level entity hierarchies

### OAS & Code Generation

- **Primary OAS**: `embedded-finance-pub-smbdo-1.0.18.yaml`
- **Generated Hooks**: `useSmbdoGetClient`, `useSmbdoUpdateClient`, `useSmbdoListQuestions`
- **Generated Types**: `ClientResponse`, `PartyResponse`, `CreatePartyRequest`, `Role`, `PartyType`
- **API Endpoints**: `/clients/{id}`, `/clients/{id}/parties`, `/questions`

---

## Business Requirements

### Updated Approach: Individual Owner Classification

The component focuses on **identifying and classifying individual owners** rather than tracking ownership percentages. The primary goal is to distinguish between:

#### Direct Individual Owners

- **Definition**: Natural persons who have a direct ownership relationship with the client entity
- **Identification**: Individuals whose `parentPartyId` points directly to the client entity
- **Characteristics**: One-step relationship from client to individual

#### Indirect Individual Owners

- **Definition**: Natural persons whose ownership flows through one or more intermediary organizations
- **Identification**: Individuals whose ownership path includes intermediary entities
- **Characteristics**: Multi-step relationship from client through intermediaries to individual

#### Intermediary Entities

- **Definition**: Organizations that sit between the client and ultimate individual owners
- **Role**: Facilitate indirect ownership relationships
- **API Role**: Use `BENEFICIAL_OWNER` role for organizational intermediaries

### Two-Tab Interface Design

#### Tab 1: Full Structure

- **Complete Hierarchy**: Display all parties (organizations and individuals) in tree format
- **Interactive Tree**: Accordion-based expandable/collapsible nodes
- **Entity Management**: Add new individuals or intermediary organizations at any level
- **Visual Relationships**: Clear parent-child relationship indicators
- **Role Indicators**: Show CLIENT, BENEFICIAL_OWNER, and other roles

#### Tab 2: Beneficial Owners

- **Natural Persons Only**: Display only individuals (no organizations)
- **Grouped Organization**:
  - **Direct Owners Section**:
    - Header: "Direct Owners" with count badge
    - List of individuals who directly own the client entity
    - Simple display: Name, role, verification status
  - **Indirect Owners Section**:
    - Header: "Indirect Owners" with count badge
    - List of individuals whose ownership flows through intermediary entities
    - Enhanced display: Name, role, verification status, plus ownership chain description
    - Chain format: "John Smith owns Innovation Ventures LLC which owns TechCorp Holdings LLC"
- **Empty States**: Appropriate messages when no direct or indirect owners exist
- **Status Badges**: Verification status and compliance indicators for all individuals

### Key Changes from Percentage-Based Tracking

#### What We No Longer Track

- ❌ **Ownership Percentages**: No percentage calculations or 25% threshold tracking
- ❌ **Effective Ownership**: No mathematical aggregation of ownership through chains
- ❌ **Percentage Validation**: No validation that percentages sum to 100%
- ❌ **Threshold Alerts**: No warnings about approaching percentage thresholds

#### What We Focus On Instead

- ✅ **Individual Identification**: Comprehensive identification of all natural persons in ownership structure
- ✅ **Relationship Classification**: Clear distinction between direct and indirect ownership paths
- ✅ **Chain Visualization**: Visual representation of ownership paths through intermediaries
- ✅ **Compliance Structure**: Ensure complete ownership chains end with identified individuals

### Core Functionality

#### 1. Ownership Structure Visualization

- **Tab 1 - Full Structure**: Complete hierarchical tree view of all parties and relationships
- **Tab 2 - Beneficial Owners**: Organized list of natural persons grouped by Direct and Indirect ownership
- **Hierarchical Tree View**: Display ownership relationships in an interactive tree
- **Multi-Level Support**: Handle n-level ownership chains (companies owning companies)
- **Visual Indicators**: Show relationship types, roles, and ownership nature
- **Navigation Controls**: Expand/collapse nodes for complex structures

#### 2. Entity and Individual Management

- **Dual Party Types**: Support both ORGANIZATION and INDIVIDUAL party types
- **Parent-Child Relationships**: Link parties through `parentPartyId` relationships
- **Role Assignment**: Assign roles (CLIENT, BENEFICIAL_OWNER, CONTROLLER, DIRECTOR)
- **Ownership Classification**: Distinguish between Direct and Indirect ownership paths

#### 3. Beneficial Owner Organization

- **Grouped Display**: Organize all natural persons into Direct and Indirect groups
- **Direct Group**: Show individuals who directly own the client entity
- **Indirect Group**: Show individuals whose ownership flows through intermediaries with full ownership chain descriptions
- **Chain Visualization**: Display complete ownership path for indirect owners (e.g., "John Smith owns Innovation Ventures LLC which owns TechCorp Holdings LLC")
- **Ultimate Owner Detection**: Identify all individuals at the end of ownership chains
- **Compliance Flagging**: Flag potential compliance issues or missing information

#### 4. Validation and Compliance

- **Completeness Validation**: Ensure all required ownership information is provided
- **Structure Validation**: Verify ownership chains are properly formed and complete
- **Regulatory Compliance**: Check against beneficial ownership regulations
- **Missing Information Detection**: Identify incomplete party information

### User Experience Requirements

#### 1. Two-Tab Navigation

- **Tab 1 - Full Structure**: Interactive tree interface with add/edit capabilities
- **Tab 2 - Beneficial Owners**: Clean, organized list view with grouped sections
- **Seamless Switching**: Easy navigation between structural and compliance views
- **Responsive Design**: Work on desktop and tablet devices

#### 2. Interactive Tree Interface (Tab 1)

- **Expand/Collapse**: Accordion-based navigation through ownership levels
- **Add Actions**: Contextual "Add Owner" buttons at each level
- **Search and Filter**: Find specific parties within complex structures
- **Visual Hierarchy**: Clear parent-child relationship indicators

#### 3. Form-Based Data Entry

- **Dynamic Forms**: Show relevant fields based on party type and role
- **Progressive Disclosure**: Reveal additional fields as needed
- **Inline Validation**: Real-time validation feedback
- **Auto-completion**: Suggest values based on existing data

#### 3. Visualization Options

- **Two Primary Views**: Full structure view and beneficial owners view
- **Grouped Organization**: Direct and indirect beneficial owners grouped separately
- **Export Capabilities**: Generate ownership charts and reports
- **Print-Friendly**: Optimize for printing and PDF generation

---

## Technical Requirements

### Data Structure

#### 1. Ownership Hierarchy

```typescript
interface OwnershipStructure {
  clientId: string;
  rootParty: OwnershipParty;
  ownershipChain: OwnershipLevel[];
  beneficialOwners: BeneficialOwnersGrouped;
  validationStatus: OwnershipValidationStatus;
}

interface BeneficialOwnersGrouped {
  direct: IndividualOwner[];
  indirect: IndividualOwner[];
}

interface OwnershipParty extends PartyResponse {
  ownershipType: 'DIRECT' | 'INDIRECT';
  ownershipPath: string[]; // Array of party IDs showing ownership chain
  children: OwnershipParty[];
}

interface IndividualOwner extends PartyResponse {
  ownershipType: 'DIRECT' | 'INDIRECT';
  ownershipChain: OwnershipChainStep[];
  chainDescription: string;
}

interface OwnershipChainStep {
  partyId: string;
  partyName: string;
  partyType: 'ORGANIZATION' | 'INDIVIDUAL';
}
```

#### 2. API Integration

- **SMBDO API**: Primary integration with Small/Medium Business Digital Onboarding API
- **Party Management**: Create, update, and retrieve party information
- **Hierarchical Queries**: Efficiently fetch party trees
- **Batch Operations**: Support bulk party creation/updates

#### 3. State Management

- **React Query**: Cache party data and ownership structures
- **Optimistic Updates**: Immediate UI updates with server sync
- **Error Handling**: Graceful handling of API errors and network issues
- **Undo/Redo**: Support for reverting ownership changes

### Performance Requirements

#### 1. Large Structure Handling

- **Efficient Rendering**: Handle ownership structures with 100+ parties
- **Progressive Loading**: Load ownership levels on-demand
- **Tabbed Organization**: Organize complex data into manageable views
- **Memory Management**: Efficient handling of complex ownership chains

#### 2. Real-time Updates

- **Live Validation**: Instant feedback on ownership structure changes
- **Progressive Saving**: Auto-save changes without user intervention
- **Chain Recalculation**: Automatically update ownership classifications when structure changes
- **Optimistic UI**: Immediate visual feedback for user actions

---

## API Requirements

### Ownership Data Retrieval

#### 1. Client and Party Data

```typescript
// Get complete client with all parties
const { data: clientData } = useSmbdoGetClient(clientId);

// Extract ownership structure
const ownershipStructure = transformPartiesToOwnershipStructure(
  clientData?.parties || [],
  clientId
);
```

#### 2. Hierarchical Relationships

- **Parent-Child Links**: Use `parentPartyId` to build hierarchy
- **Role-Based Filtering**: Filter parties by role for specific views
- **Path Resolution**: Resolve ownership paths from root to individual owners
- **Chain Analysis**: Analyze ownership chains to classify direct vs indirect ownership

### Party Management Operations

#### 1. Adding Parties

```typescript
// Add new party to ownership structure
const addPartyMutation = useSmbdoUpdateClient();

const addOwnershipEntity = async (entityData: OwnershipEntityFormData) => {
  await addPartyMutation.mutateAsync({
    id: clientId,
    data: {
      addParties: [transformToApiFormat(entityData)],
    },
  });
};
```

#### 2. Updating Ownership

- **Bulk Updates**: Update multiple parties in single API call
- **Incremental Changes**: Support partial updates to ownership structure
- **Validation Integration**: Server-side validation of ownership rules
- **Change Tracking**: Track and audit ownership changes

---

## Compliance Requirements

### Individual Owner Classification

#### 1. Direct vs Indirect Owner Identification

- **Direct Owners**: Individuals who own the client entity directly (parent-child relationship)
- **Indirect Owners**: Individuals whose ownership flows through intermediary entities
- **Chain Tracking**: Track complete ownership chains from client to individual
- **Multiple Paths**: Handle individuals who may have both direct and indirect ownership

#### 2. Ultimate Individual Owner (UIO) Identification

- **Individual Endpoints**: Ensure all ownership chains ultimately lead to individuals
- **Intermediary Entities**: Support organizations as intermediary owners in ownership chains
- **Documentation Requirements**: Track required documentation for individual owners
- **Verification Status**: Maintain verification status for each individual owner

#### 3. Regulatory Compliance

- **CDD/KYC Integration**: Support Customer Due Diligence workflows for individual identification
- **AML Screening**: Integration points for Anti-Money Laundering checks
- **Ownership Reporting**: Generate reports showing direct and indirect individual ownership
- **Audit Trails**: Comprehensive logging of ownership structure changes

### Data Privacy and Security

#### 1. Sensitive Information Handling

- **PII Protection**: Secure handling of personally identifiable information
- **Access Controls**: Role-based access to ownership information
- **Data Minimization**: Collect only necessary ownership details
- **Retention Policies**: Appropriate data retention and deletion

#### 2. Audit and Compliance

- **Change Logging**: Log all ownership structure modifications
- **User Attribution**: Track who made what changes when
- **Compliance Reports**: Generate audit reports for regulators
- **Data Integrity**: Ensure ownership data consistency and accuracy

---

## Integration Points

### External Systems

#### 1. Identity Verification

- **Document Upload**: Integration with document management systems
- **Identity Checks**: Third-party identity verification services
- **Sanctions Screening**: AML/sanctions list checking
- **Risk Assessment**: Integration with risk scoring systems

#### 2. Workflow Management

- **Onboarding Workflows**: Integration with broader client onboarding
- **Approval Processes**: Support for manual review and approval
- **Task Management**: Generate tasks for incomplete ownership information
- **Notification Systems**: Alerts for ownership changes and issues

### Component Ecosystem

#### 1. Related Components

- **Client Overview**: Show ownership as part of client profile
- **Document Manager**: Upload ownership-related documents
- **Compliance Dashboard**: Aggregate compliance status across clients
- **Reporting Tools**: Generate ownership reports and visualizations

#### 2. Data Sharing

- **Shared State**: Common ownership data across components
- **Event Bus**: Communicate ownership changes to other components
- **Caching Strategy**: Shared cache for ownership and party data
- **Consistency Maintenance**: Keep ownership data synchronized

---

## Future Enhancements

### Advanced Features

#### 1. Ownership Analytics

- **Trend Analysis**: Track ownership changes over time
- **Risk Metrics**: Calculate risk scores based on ownership structure
- **Compliance Dashboards**: Real-time compliance monitoring
- **Predictive Analytics**: Identify potential compliance issues

#### 2. Enhanced Visualization

- **3D Visualizations**: Advanced 3D ownership tree representations
- **Interactive Diagrams**: Drag-and-drop ownership management
- **Mobile Optimization**: Touch-friendly interfaces for mobile devices
- **Accessibility**: Full screen reader and keyboard navigation support

#### 3. Integration Expansion

- **Blockchain Integration**: Immutable ownership record keeping
- **AI-Powered Validation**: Automated ownership structure validation
- **Real-time Collaboration**: Multi-user simultaneous editing
- **Advanced Reporting**: Customizable report generation and scheduling

---

## Implementation Phases

### Phase 1: Foundation (Current)

- ✅ Component structure and placeholder implementation
- ✅ Basic types and interfaces
- ✅ Storybook integration
- ✅ Test framework setup

### Phase 2: Core Functionality

- ✅ Ownership tree visualization
- ✅ Individual/intermediary forms
- ✅ API integration with SMBDO
- ✅ Two-tab interface (Full Structure, Beneficial Owners with Direct/Indirect grouping)

### Phase 3: Advanced Features

- ⏳ Enhanced validation rules for ownership completeness
- ⏳ Advanced compliance checking for individual identification
- ⏳ Reporting capabilities for ownership structure
- ⏳ Bulk import/export of ownership data

### Phase 4: Enterprise Features

- ⏳ Performance optimization
- ⏳ Advanced analytics
- ⏳ Workflow integration
- ⏳ Mobile optimization

---

## Success Metrics

### Technical Metrics

- **Performance**: Load ownership structures with 100+ parties in <2 seconds
- **Accuracy**: 99.9% data consistency across API operations
- **Reliability**: 99.5% uptime for ownership operations
- **Usability**: Complete ownership entry in <5 minutes for complex structures

### Business Metrics

- **Compliance**: Reduce compliance review time by 60%
- **Accuracy**: Decrease ownership data errors by 80%
- **Efficiency**: Increase onboarding speed by 40%
- **User Satisfaction**: Achieve 4.5/5 user satisfaction rating
