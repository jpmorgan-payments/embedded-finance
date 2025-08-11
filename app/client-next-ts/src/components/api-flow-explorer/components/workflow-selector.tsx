// WorkflowSelector component for Arazzo Flow Dialog
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type ArazzoWorkflow } from '../types';

interface WorkflowSelectorProps {
  workflows: ArazzoWorkflow[];
  activeWorkflow: ArazzoWorkflow | undefined;
  onWorkflowChange: (workflowId: string) => void;
}

/**
 * WorkflowSelector component for selecting Arazzo workflows
 */
export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ 
  workflows, 
  activeWorkflow, 
  onWorkflowChange 
}) => {
  if (!workflows.length) return null;
  
  return (
    <div className="w-96 flex flex-col gap-1">
      <div className="flex justify-between">
        <label htmlFor="workflow-selector" className="text-sm font-medium">
          Select Workflow
        </label>
      </div>
      <Select
        value={activeWorkflow?.workflowId}
        onValueChange={onWorkflowChange}
      >
        <SelectTrigger id="workflow-selector" aria-label="Workflow selector">
          <SelectValue placeholder="Select workflow">
            {activeWorkflow?.summary}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {workflows.map((w) => (
            <SelectItem key={w.workflowId} value={w.workflowId}>
              {w.summary || 'Unnamed workflow'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
