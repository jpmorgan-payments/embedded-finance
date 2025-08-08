import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface DecisionNodeData {
  label: string;
  description?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const DecisionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { label, description, isSelected, onSelect } =
    data as unknown as DecisionNodeData;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <div
      className={`
        min-w-[180px] p-3 cursor-pointer
        transition-all duration-200 hover:shadow-md
        bg-gradient-to-br from-blue-50 to-blue-100
        border-2 border-blue-400 text-blue-900
        ${isSelected || selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        transform: 'rotate(0deg)',
      }}
      onClick={handleClick}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Node content - positioned to account for diamond shape */}
      <div
        className="flex items-center justify-center space-x-2 h-full"
        style={{
          paddingTop: '20px',
          paddingBottom: '20px',
        }}
      >
        <GitBranch className="w-4 h-4" />
        <div className="text-center">
          <div className="font-semibold text-sm leading-tight">{label}</div>
          {description && (
            <div className="text-xs text-blue-700 mt-1 leading-tight">
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Output handles for success and failure paths */}
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={{ top: '50%', right: '-6px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="failure"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
        style={{ top: '50%', left: '-6px' }}
      />
    </div>
  );
};
