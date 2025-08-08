import React, { useState } from 'react';
import type {
  OnboardingCriteria,
  CriteriaOptions,
  ApiJourney,
  ApiAttribute,
  ViewMode,
} from './types';
import { CriteriaSelector } from './components/CriteriaSelector';
import { JourneyVisualizer } from './components/JourneyVisualizer';
import { AttributeExplorer } from './components/AttributeExplorer';
import { PayloadViewer } from './components/PayloadViewer';
import { ArazzoViewer } from './components/ArazzoViewer';

interface ApiFlowExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiFlowExplorer: React.FC<ApiFlowExplorerProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCriteria, setSelectedCriteria] =
    useState<OnboardingCriteria | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [journey, setJourney] = useState<ApiJourney | null>(null);
  const [attributes, setAttributes] = useState<ApiAttribute[]>([]);

  // Placeholder data - will be replaced with actual data loading
  const criteriaOptions: CriteriaOptions = {
    products: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'],
    jurisdictions: ['US', 'CA'],
    legalEntityTypes: [
      'LLC',
      'CORPORATION',
      'PARTNERSHIP',
      'SOLE_PROPRIETORSHIP',
    ],
  };

  const handleCriteriaChange = (criteria: OnboardingCriteria) => {
    setSelectedCriteria(criteria);
    // TODO: Load journey and attributes based on criteria
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    // TODO: Filter attributes based on selected node
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold">EFS Onboarding Explorer</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Criteria Selection */}
          <div className="p-6 border-b">
            <CriteriaSelector
              onCriteriaChange={handleCriteriaChange}
              availableOptions={criteriaOptions}
            />
          </div>

          {/* Main Content Area */}
          {selectedCriteria && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Journey Visualization */}
              <div className="w-1/2 border-r">
                {journey && (
                  <JourneyVisualizer
                    journey={journey}
                    onNodeSelect={handleNodeSelect}
                    selectedNode={selectedNode}
                  />
                )}
              </div>

              {/* Right Panel - Attribute Explorer */}
              <div className="w-1/2 flex flex-col">
                <AttributeExplorer
                  attributes={attributes}
                  selectedOperation={selectedNode}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {viewMode === 'json' && (
                  <PayloadViewer
                    selectedOperation={selectedNode}
                    criteria={selectedCriteria}
                  />
                )}

                {selectedNode && (
                  <ArazzoViewer
                    stepId={selectedNode}
                    workflow={null} // TODO: Pass actual workflow
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiFlowExplorer;
