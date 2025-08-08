import React from 'react';
import type { OnboardingCriteria } from '../types';

interface PayloadViewerProps {
  selectedOperation?: string;
  criteria: OnboardingCriteria;
}

export const PayloadViewer: React.FC<PayloadViewerProps> = ({
  selectedOperation,
  criteria,
}) => {
  return (
    <div className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">
        JSON Payload {selectedOperation && `for ${selectedOperation}`}
      </h3>

      {/* Placeholder for JSON payload implementation */}
      <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">JSON Payload Viewer</p>
          <p className="text-sm">Implementation will be added in task 9</p>
          {selectedOperation && (
            <div className="mt-4 text-xs">
              <p>Operation: {selectedOperation}</p>
              <p>Criteria: {JSON.stringify(criteria, null, 2)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
