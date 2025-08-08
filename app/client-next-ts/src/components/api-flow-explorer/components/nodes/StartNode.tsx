import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';

interface StartNodeData {
  label: string;
  description?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const StartNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { label, description, isSelected, onSelect } =
    data as unknown as StartNodeData;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <div
      className={`
        min-w-[150px] p-4 rounded-full border-2 cursor-pointer
        transition-all duration-200 hover:shadow-md
        bg-gradient-to-br from-green-50 to-green-100
        border-green-400 text-green-900
        ${isSelected || selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
      onClick={handleClick}
    >
      {/* Node content */}
      <div className="flex items-center justify-center space-x-2">
        <Play className="w-4 h-4 fill-current" />
        <div className="text-center">
          <div className="font-semibold text-sm">{label}</div>
          {description && (
            <div className="text-xs text-green-700 mt-1">{description}</div>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  );
};
