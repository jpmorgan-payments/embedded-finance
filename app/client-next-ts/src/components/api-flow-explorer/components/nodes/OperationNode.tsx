import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ApiOperation } from '../../types/api';

interface OperationNodeData {
  label: string;
  method?: string;
  path?: string;
  status: 'success' | 'failure' | 'neutral';
  description?: string;
  operation?: ApiOperation;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const OperationNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { label, method, path, status, description, isSelected, onSelect } =
    data as unknown as OperationNodeData;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50 text-green-900';
      case 'failure':
        return 'border-red-500 bg-red-50 text-red-900';
      default:
        return 'border-gray-400 bg-white text-gray-900';
    }
  };

  const getMethodColor = () => {
    switch (method?.toUpperCase()) {
      case 'POST':
        return 'bg-green-100 text-green-800';
      case 'GET':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`
        min-w-[200px] max-w-[300px] p-3 rounded-lg border-2 cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${getStatusColor()}
        ${isSelected || selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
      onClick={handleClick}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Node content */}
      <div className="space-y-2">
        {/* Method badge */}
        {method && (
          <div className="flex justify-start">
            <span
              className={`
                px-2 py-1 text-xs font-semibold rounded-full
                ${getMethodColor()}
              `}
            >
              {method.toUpperCase()}
            </span>
          </div>
        )}

        {/* Main label */}
        <div className="font-semibold text-sm leading-tight">{label}</div>

        {/* API path */}
        {path && (
          <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
            {path}
          </div>
        )}

        {/* Description */}
        {description && description !== label && (
          <div className="text-xs text-gray-600 leading-relaxed">
            {description}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div
              className={`
                w-2 h-2 rounded-full
                ${status === 'success' ? 'bg-green-500' : ''}
                ${status === 'failure' ? 'bg-red-500' : ''}
                ${status === 'neutral' ? 'bg-gray-400' : ''}
              `}
            />
            <span className="text-xs capitalize text-gray-600">
              {status === 'neutral' ? 'standard' : status}
            </span>
          </div>

          {/* Required indicator */}
          {status === 'success' && (
            <span className="text-xs font-medium text-green-700">Required</span>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
};
