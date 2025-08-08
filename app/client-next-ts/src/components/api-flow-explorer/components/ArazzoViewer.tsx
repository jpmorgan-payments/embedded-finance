import React from 'react';
import type { ArazzoWorkflow } from '../types';

interface ArazzoViewerProps {
  stepId: string;
  workflow: ArazzoWorkflow | null;
}

export const ArazzoViewer: React.FC<ArazzoViewerProps> = ({
  stepId,
  workflow,
}) => {
  const step = workflow?.steps.find((s) => s.stepId === stepId);

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-semibold mb-4">Arazzo Step Details</h3>

      {step ? (
        <div className="space-y-3">
          <div>
            <span className="font-medium">Step ID:</span> {step.stepId}
          </div>
          <div>
            <span className="font-medium">Description:</span> {step.description}
          </div>
          <div>
            <span className="font-medium">Operation ID:</span>{' '}
            {step.operationId}
          </div>

          {step.parameters && step.parameters.length > 0 && (
            <div>
              <span className="font-medium">Parameters:</span>
              <ul className="mt-1 ml-4 list-disc">
                {step.parameters.map((param, index) => (
                  <li key={index} className="text-sm">
                    {param.name} ({param.in}): {String(param.value)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.successCriteria && step.successCriteria.length > 0 && (
            <div>
              <span className="font-medium">Success Criteria:</span>
              <ul className="mt-1 ml-4 list-disc">
                {step.successCriteria.map((criteria, index) => (
                  <li key={index} className="text-sm">
                    {criteria.condition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>Arazzo Step Viewer</p>
          <p className="text-sm mt-2">
            {workflow
              ? `No step found with ID: ${stepId}`
              : 'Implementation will be added in task 12'}
          </p>
        </div>
      )}
    </div>
  );
};
