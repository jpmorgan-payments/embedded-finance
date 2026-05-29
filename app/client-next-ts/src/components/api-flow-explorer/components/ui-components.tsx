// Common UI components used in Arazzo Flow Dialog
import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  HTTP_VERB_STYLES,
  type ArazzoWorkflowStep,
  type HttpVerb,
  type OasOperationInfo,
} from '../types';
import { detectHttpVerb } from '../utils/schema-utils';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

/**
 * DataTable component for displaying structured data
 */
export const DataTable: React.FC<TableProps> = ({
  headers,
  children,
  className,
}) => (
  <div
    className={cn(
      'max-h-[calc(100%-20px)] overflow-x-auto overflow-y-auto',
      className
    )}
  >
    <table className="w-full min-w-[800px] text-sm">
      <thead className="sticky top-0 z-10 bg-jpm-brown-50">
        <tr className="border-b text-left">
          {headers.map((header, idx) => (
            <th key={idx} className="py-2 pr-4">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

/**
 * EmptyRow component for displaying empty state in tables
 */
export const EmptyRow: React.FC<{ colSpan?: number }> = ({ colSpan = 1 }) => (
  <tr>
    <td className="py-2 text-xs text-muted-foreground" colSpan={colSpan}>
      None
    </td>
  </tr>
);

/**
 * HighlightCode component for syntax highlighting code blocks
 */
export const HighlightCode: React.FC<{ code: string; language: string }> = ({
  code,
  language,
}) => (
  <Highlight theme={themes.vsLight} code={code} language={language}>
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <pre
        className={`${className} max-h-full overflow-auto text-xs`}
        style={style}
      >
        {tokens.map((line, i) => (
          <div key={i} {...getLineProps({ line })}>
            {line.map((token, key) => (
              <span key={key} {...getTokenProps({ token })} />
            ))}
          </div>
        ))}
      </pre>
    )}
  </Highlight>
);

interface StepCardProps {
  step: ArazzoWorkflowStep;
  isSelected: boolean;
  onClick: () => void;
  oasOperation?: OasOperationInfo;
}

/**
 * StepCard component for displaying workflow steps
 */
export const StepCard: React.FC<StepCardProps> = ({
  step,
  isSelected,
  onClick,
  oasOperation,
}) => {
  const verb = oasOperation?.verb || detectHttpVerb(step.operationId);

  return (
    <button
      key={step.stepId}
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border bg-white p-3 text-left',
        'transition-colors hover:border-jpm-brown-300 hover:bg-jpm-brown-50',
        isSelected && 'border-jpm-brown bg-jpm-brown-50'
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <Badge
          className={cn(
            'border px-2 py-0.5 text-[10px]',
            HTTP_VERB_STYLES[verb as HttpVerb]
          )}
          variant="outline"
        >
          {verb}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {step.operationId || 'Unknown operation'}
        </span>
      </div>
      {step.operationId && oasOperation?.path && (
        <div className="mb-1 truncate font-mono text-[10px] text-muted-foreground">
          {oasOperation.path}
        </div>
      )}
      <div className="line-clamp-3 text-sm leading-5">
        {step.description || step.stepId}
      </div>
    </button>
  );
};
