# Indirect Ownership Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Digital Onboarding - Beneficial Ownership](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/)
> - [Party Management](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/party-management)
>
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

### Core Functionality

#### 1. Ownership Structure Visualization
- **Hierarchical Tree View**: Display ownership relationships in an interactive tree
- **Multi-Level Support**: Handle n-level ownership chains (companies owning companies)
- **Visual Indicators**: Show ownership percentages, roles, and relationship types
- **Navigation Controls**: Expand/collapse nodes, zoom, pan for large structures

#### 2. Entity and Individual Management
- **Dual Party Types**: Support both ORGANIZATION and INDIVIDUAL party types
- **Parent-Child Relationships**: Link parties through `parentPartyId` relationships
- **Role Assignment**: Assign roles (CLIENT, BENEFICIAL_OWNER, CONTROLLER, DIRECTOR)
- **Ownership Nature**: Distinguish between Direct and Indirect ownership

#### 3. Beneficial Owner Identification
- **Ultimate Owner Detection**: Identify individuals at the end of ownership chains
- **25% Threshold**: Highlight beneficial owners with ≥25% ownership
- **Ownership Path Tracking**: Show complete ownership path from root to individual
- **Compliance Flagging**: Flag potential compliance issues or missing information

#### 4. Validation and Compliance
- **Completeness Validation**: Ensure all required ownership information is provided
- **Percentage Validation**: Verify ownership percentages add up correctly
- **Regulatory Compliance**: Check against beneficial ownership regulations
- **Missing Information Detection**: Identify incomplete party information

### User Experience Requirements

#### 1. Interactive Tree Interface
- **Drag and Drop**: Rearrange ownership structure (if applicable)
- **Context Menus**: Right-click actions for adding/editing parties
- **Search and Filter**: Find specific parties within complex structures
- **Responsive Design**: Work on desktop and tablet devices

#### 2. Form-Based Data Entry
- **Dynamic Forms**: Show relevant fields based on party type and role
- **Progressive Disclosure**: Reveal additional fields as needed
- **Inline Validation**: Real-time validation feedback
- **Auto-completion**: Suggest values based on existing data

#### 3. Visualization Options
- **Multiple Views**: Tree view, list view, tabular view
- **Customizable Display**: Show/hide ownership percentages, roles, details
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
  ultimateBeneficialOwners: IndividualOwner[];
  validationStatus: OwnershipValidationStatus;
}

interface OwnershipParty extends PartyResponse {
  ownershipPercentage?: number;
  ownershipType: 'DIRECT' | 'INDIRECT';
  children: OwnershipParty[];
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
- **Virtualization**: Handle ownership trees with 100+ parties
- **Lazy Loading**: Load ownership levels on-demand
- **Pagination**: Break large structures into manageable chunks
- **Memory Management**: Efficient handling of complex data structures

#### 2. Real-time Updates
- **Live Validation**: Instant feedback on ownership changes
- **Progressive Saving**: Auto-save changes without user intervention
- **Conflict Resolution**: Handle concurrent edits by multiple users
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
- **Ownership Calculations**: Calculate effective ownership percentages
- **Path Resolution**: Resolve ownership paths from root to leaves

### Party Management Operations

#### 1. Adding Parties
```typescript
// Add new party to ownership structure
const addPartyMutation = useSmbdoUpdateClient();

const addOwnershipEntity = async (entityData: OwnershipEntityFormData) => {
  await addPartyMutation.mutateAsync({
    id: clientId,
    data: {
      addParties: [transformToApiFormat(entityData)]
    }
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

### Beneficial Ownership Rules

#### 1. 25% Ownership Threshold
- **Automatic Detection**: Flag individuals with ≥25% ownership
- **Indirect Calculation**: Calculate indirect ownership through entity chains
- **Multiple Paths**: Handle ownership through multiple paths
- **Threshold Warnings**: Alert when approaching 25% threshold

#### 2. Ultimate Beneficial Owner (UBO) Identification
- **Individual Endpoints**: Ensure all ownership chains end with individuals
- **Control vs. Ownership**: Distinguish between ownership and control roles
- **Documentation Requirements**: Track required documentation for UBOs
- **Verification Status**: Maintain verification status for each UBO

#### 3. Regulatory Compliance
- **CDD/KYC Integration**: Support Customer Due Diligence workflows
- **AML Screening**: Integration points for Anti-Money Laundering checks
- **Reporting Generation**: Generate ownership reports for regulatory submission
- **Audit Trails**: Comprehensive logging of ownership changes

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
- 🔄 Ownership tree visualization
- 🔄 Basic entity/individual forms
- 🔄 API integration with SMBDO
- 🔄 Validation framework

### Phase 3: Advanced Features
- ⏳ Interactive tree manipulation
- ⏳ Complex validation rules
- ⏳ Compliance checking
- ⏳ Reporting capabilities

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
