# Implementation Plan

- [x] 1. Set up project structure and core interfaces

  - Create directory structure in `app/client-next-ts/src/components/api-flow-explorer/`
  - Define TypeScript interfaces for API operations, Arazzo workflows, and journey visualization
  - Set up index.ts exports and basic component shells
  - _Requirements: 1.1, 7.1, 7.2_

- [x] 2. Implement OpenAPI specification parsing utilities

  - Create `utils/specParser.ts` with functions to parse OpenAPI YAML files
  - Implement extraction of POST operations and their request body schemas
  - Create `utils/attributeExtractor.ts` to extract payload attributes with JSON paths
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Create Arazzo workflow processing system

  - Implement `utils/arazzoProcessor.ts` to parse Arazzo YAML specifications
  - Create `hooks/useArazzoProcessor.ts` for loading and processing Arazzo files
  - Build workflow step extraction and dependency mapping
  - _Requirements: 3.1, 3.2, 5.2, 5.3_

- [x] 4. Build criteria mapping and configuration system

  - Create `data/criteria-mapping.json` with initial mapping configurations
  - Implement configuration loading and validation logic
  - Create sample Arazzo specification files for testing
  - Add error handling for missing or invalid configurations
  - _Requirements: 1.2, 1.3, 1.4, 7.3_

- [x] 5. Implement CriteriaSelector component

  - Create `components/CriteriaSelector.tsx` with dropdown controls for product, jurisdiction, and legal entity type
  - Implement form validation and criteria combination checking
  - Add loading states and error handling for invalid combinations
  - Style component to match existing application design system
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6. Create journey building and visualization logic

  - Implement `hooks/useJourneyBuilder.ts` to convert Arazzo workflows to ReactFlow nodes and edges
  - Create node positioning algorithms for automatic layout
  - Build success/failure path visualization logic
  - Add journey metadata extraction and processing
  - _Requirements: 2.1, 2.2, 2.4, 8.2, 8.3_

- [x] 7. Implement JourneyVisualizer component with ReactFlow

  - Create `components/JourneyVisualizer.tsx` using ReactFlow library
  - Implement custom node types for API operations, decisions, and start/end points
  - Add interactive node selection and hover states
  - Style nodes with visual indicators for success/failure paths and required vs optional operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.2, 8.3, 8.4_

- [ ] 8. Build AttributeExplorer component with table functionality

  - Create `components/AttributeExplorer.tsx` with sortable, filterable table
  - Implement attribute grouping by API operation and logical categories
  - Add search and filtering capabilities for large attribute sets
  - Display JSON paths, descriptions, and requirement indicators
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.1, 8.4_

- [ ] 9. Implement PayloadViewer component for JSON display

  - Create `components/PayloadViewer.tsx` with syntax-highlighted JSON display
  - Implement filtering to show only required fields based on selected criteria
  - Add collapsible sections for complex nested objects
  - Integrate with Monaco Editor or similar for enhanced JSON viewing
  - _Requirements: 6.2, 6.5, 8.1, 8.4_

- [ ] 10. Create side-by-side view mode functionality

  - Implement tab navigation between table, JSON, and side-by-side views
  - Create side-by-side layout component showing both table and JSON simultaneously
  - Add attribute highlighting and mapping between table rows and JSON properties
  - Ensure responsive design for different screen sizes
  - _Requirements: 6.1, 6.3, 6.4, 6.6_

- [ ] 11. Implement operation selection and filtering logic

  - Add click handlers for journey visualization nodes to filter attributes
  - Implement state management for selected operations and view modes
  - Create filtered attribute display based on selected API operation
  - Add breadcrumb navigation showing current selection context
  - _Requirements: 5.1, 5.4, 6.4_

- [ ] 12. Build ArazzoViewer component for step details

  - Create `components/ArazzoViewer.tsx` to display Arazzo step properties
  - Implement visual formatting for step dependencies, parameters, and success criteria
  - Add expandable sections for detailed step information
  - Style component for easy consumption of technical details
  - _Requirements: 5.2, 5.3, 5.5_

- [ ] 13. Create main ApiFlowExplorer modal component

  - Implement `ApiFlowExplorer.tsx` as the root component with modal container
  - Integrate all sub-components with proper state management
  - Add modal controls (close, minimize, maximize) and keyboard navigation
  - Implement responsive layout for different screen sizes
  - _Requirements: 1.5, 2.1, 6.1_

- [ ] 14. Add Arazzo specification download functionality

  - Implement download button and file serving logic for Arazzo specs
  - Add preview modal for reviewing Arazzo specifications before download
  - Create error handling for missing or unavailable specification files
  - Add download progress indicators and success/failure notifications
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 15. Implement comprehensive error handling and loading states

  - Add error boundaries for component-level error handling
  - Implement loading spinners and skeleton screens for async operations
  - Create user-friendly error messages with recovery suggestions
  - Add retry mechanisms for failed API spec or Arazzo file loading
  - _Requirements: 3.3, 7.3_

- [ ] 16. Add comprehensive unit and integration tests

  - Write unit tests for all utility functions and custom hooks
  - Create integration tests for component interactions and data flow
  - Add tests for error scenarios and edge cases
  - Implement visual regression tests for journey visualization
  - _Requirements: All requirements - testing coverage_

- [ ] 17. Optimize performance and bundle size

  - Implement lazy loading for Arazzo specifications and large data sets
  - Add memoization for expensive parsing and computation operations
  - Optimize ReactFlow performance for complex journey visualizations
  - Implement code splitting to avoid impacting main application bundle
  - _Requirements: 7.1, 7.2_

- [ ] 18. Create documentation and usage examples
  - Write component documentation with usage examples
  - Create developer guide for extending criteria and adding new Arazzo specs
  - Document configuration file formats and validation rules
  - Add inline help and tooltips for complex features
  - _Requirements: 7.1, 7.2, 7.3_
