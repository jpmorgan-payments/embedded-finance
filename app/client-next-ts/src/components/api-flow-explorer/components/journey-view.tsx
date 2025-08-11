// JourneyView component for displaying workflow journey overview
import React from 'react';
import { DataTable } from './ui-components';
import type { ArazzoWorkflow, OasOperationInfo } from '../types';
import { detectHttpVerb, extractValidationConstraints, flattenJsonPaths, getSchemaForPath, getStepPayload } from '../utils/schema-utils';

interface JourneyViewProps {
  activeWorkflow: ArazzoWorkflow;
  stepOasOperations: Record<string, OasOperationInfo>;
  oasSpec: any;
}

/**
 * JourneyView component for displaying an aggregated view of workflow steps
 */
export const JourneyView: React.FC<JourneyViewProps> = ({ 
  activeWorkflow,
  stepOasOperations,
  oasSpec
}) => {
  return (
    <div className="w-full h-full flex flex-col max-h-full">
      <div className="shrink-0 bg-jpm-brown-100 border-b border-jpm-brown-300 px-2 sm:px-4 py-2 text-sm font-medium text-jpm-brown-900">
        Journey Inputs (aggregated across POST payloads)
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-4 max-h-[calc(100%-40px)]">
        {(() => {
          const postSteps = (activeWorkflow?.steps ?? []).filter(
            (s) => {
              // Check if we have OAS operation data first
              const oasOp = stepOasOperations[s.stepId];
              if (oasOp) {
                return oasOp.verb === 'POST';
              }
              // Fallback to operation ID detection
              return detectHttpVerb(s.operationId) === 'POST';
            }
          );
          const rows = postSteps.flatMap((s) => {
            const payload = getStepPayload(s);
            return flattenJsonPaths(payload, '$').map((r) => ({
              operation: s.operationId ?? 'POST',
              path: r.path,
            }));
          });
          
          if (rows.length === 0) {
            return (
              <div className="text-sm text-muted-foreground">
                No POST payloads detected in this workflow.
              </div>
            );
          }
          
          // Add validation info to rows
          const rowsWithValidation = rows.map((r) => {
            const step = postSteps.find(s => s.operationId === r.operation);
            const stepId = step?.stepId || '';
            const operation = step?.operationId || '';
            
            // Get schema for this path
            const schema = getSchemaForPath(
              r.path, 
              oasSpec, 
              operation
            );
            
            // Extract validation constraints
            const validationText = extractValidationConstraints(schema);
            
            return {
              ...r,
              validation: validationText,
              schemaInfo: schema,
              stepId
            };
          });
          
          return (
            <DataTable headers={['API Operation', 'JSON Path', 'Validation', 'Description']}>
              {rowsWithValidation.map((r, idx) => (
                <tr
                  key={`${r.operation}-${r.path}-${idx}`}
                  className="border-b last:border-0"
                >
                  <td className="py-2 pr-4 text-xs text-muted-foreground">
                    {r.operation}
                    {postSteps.find(s => s.operationId === r.operation) && 
                      stepOasOperations[postSteps.find(s => s.operationId === r.operation)?.stepId || '']?.path && (
                        <div className="text-[10px] mt-1">
                          {stepOasOperations[postSteps.find(s => s.operationId === r.operation)?.stepId || '']?.path}
                        </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {r.path}
                  </td>
                  <td className="py-2 pr-4 text-xs">
                    {r.validation ? (
                      <div className="text-xs text-muted-foreground">
                        {r.validation}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {r.schemaInfo?.description || ''}
                  </td>
                </tr>
              ))}
            </DataTable>
          );
        })()}
      </div>
    </div>
  );
};
