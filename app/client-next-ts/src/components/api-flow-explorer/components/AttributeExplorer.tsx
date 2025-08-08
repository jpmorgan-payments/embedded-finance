import React from 'react';
import type { ApiAttribute, ViewMode } from '../types';

interface AttributeExplorerProps {
  attributes: ApiAttribute[];
  selectedOperation?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const AttributeExplorer: React.FC<AttributeExplorerProps> = ({
  attributes,
  selectedOperation,
  viewMode,
  onViewModeChange,
}) => {
  const filteredAttributes = selectedOperation
    ? attributes.filter((attr) => attr.operationId === selectedOperation)
    : attributes;

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8 px-4">
          {(['table', 'json', 'side-by-side'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === mode
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {mode === 'side-by-side'
                ? 'Side by Side'
                : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {viewMode === 'table' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              API Attributes {selectedOperation && `for ${selectedOperation}`}
            </h3>

            {filteredAttributes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No attributes to display</p>
                <p className="text-sm mt-2">
                  {selectedOperation
                    ? 'Select a different operation or clear the selection'
                    : 'Load a journey to see attributes'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        JSON Path
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttributes.map((attr, index) => (
                      <tr key={`${attr.operationId}-${attr.jsonPath}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attr.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {attr.jsonPath}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attr.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              attr.required
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {attr.required ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {attr.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {viewMode === 'json' && (
          <div className="text-center text-gray-500 py-8">
            <p>JSON Payload View</p>
            <p className="text-sm mt-2">
              Implementation will be added in task 9
            </p>
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="text-center text-gray-500 py-8">
            <p>Side-by-Side View</p>
            <p className="text-sm mt-2">
              Implementation will be added in task 10
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
