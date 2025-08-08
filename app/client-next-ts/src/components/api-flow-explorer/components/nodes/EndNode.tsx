import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { CheckCircle, XCircle } from 'lucide-react';

interface EndNodeData {
  label: string;
  status: 'success' | 'failure' | 'neutral';
  description?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const EndNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { label, status, description, isSelected, onSelect } =
    data as unknown as EndNodeData;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return {
          container:
            'bg-gradient-to-br from-green-50 to-green-100 border-green-400 text-green-900',
          icon: CheckCircle,
          handleColor: '!bg-green-500',
        };
      case 'failure':
        return {
          container:
            'bg-gradient-to-br from-red-50 to-red-100 border-red-400 text-red-900',
          icon: XCircle,
          handleColor: '!bg-red-500',
        };
      default:
        return {
          container:
            'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 text-gray-900',
          icon: CheckCircle,
          handleColor: '!bg-gray-500',
        };
    }
  };

  const styles = getStatusStyles();
  const IconComponent = styles.icon;

  return (
    <div
      className={`
        min-w-[150px] p-4 rounded-full border-2 cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${styles.container}
        ${isSelected || selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
      onClick={handleClick}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${styles.handleColor} !border-2 !border-white`}
      />

      {/* Node content */}
      <div className="flex items-center justify-center space-x-2">
        <IconComponent className="w-4 h-4" />
        <div className="text-center">
          <div className="font-semibold text-sm">{label}</div>
          {description && (
            <div className="text-xs mt-1 opacity-80">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
};
