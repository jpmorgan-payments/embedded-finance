'use client';

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Edit, 
  Trash2, 
  User, 
  Building 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { renderOwnershipChain } from './OwnershipChainRenderer';
import type { OwnershipStructureListProps, OwnerItemProps } from './types';
import { VALIDATION_MESSAGES } from '../V2AlternateIndirectOwnership/types';

/**
 * Individual owner item component
 */
const OwnerItem: React.FC<OwnerItemProps> = ({
  owner,
  rootCompanyName,
  onBuildHierarchy,
  onEditHierarchy,
  onRemoveOwner,
  readOnly = false,
}) => {
  // Determine status indicator
  const getStatusIndicator = () => {
    switch (owner.status) {
      case 'COMPLETE':
        return {
          icon: <CheckCircle2 className="eb-h-4 eb-w-4 eb-text-green-600" />,
          badge: <Badge className="eb-bg-green-100 eb-text-green-700">Complete</Badge>,
          message: null,
        };
      case 'PENDING_HIERARCHY':
        return {
          icon: <Clock className="eb-h-4 eb-w-4 eb-text-yellow-600" />,
          badge: <Badge className="eb-bg-yellow-100 eb-text-yellow-700">Pending Hierarchy</Badge>,
          message: VALIDATION_MESSAGES.pendingHierarchy,
        };
      case 'ERROR':
        return {
          icon: <AlertTriangle className="eb-h-4 eb-w-4 eb-text-red-600" />,
          badge: <Badge className="eb-bg-red-100 eb-text-red-700">Error</Badge>,
          message: owner.validationErrors?.[0] || 'Validation error',
        };
      default:
        return {
          icon: <Clock className="eb-h-4 eb-w-4 eb-text-gray-400" />,
          badge: <Badge className="eb-bg-gray-100 eb-text-gray-700">Unknown</Badge>,
          message: null,
        };
    }
  };

  const status = getStatusIndicator();

  return (
    <div className="eb-p-4 eb-border eb-rounded-lg eb-bg-white eb-space-y-3">
      {/* Owner Header */}
      <div className="eb-flex eb-items-center eb-justify-between">
        <div className="eb-flex eb-items-center eb-gap-3">
          {status.icon}
          <div>
            <div className="eb-font-medium eb-text-gray-900">
              {owner.firstName} {owner.lastName}
            </div>
            <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-gray-600">
              {owner.ownershipType === 'DIRECT' ? (
                <User className="eb-h-3 eb-w-3" />
              ) : (
                <Building className="eb-h-3 eb-w-3" />
              )}
              <span>
                {owner.ownershipType === 'DIRECT' ? 'Direct Owner' : 'Indirect Owner'}
                {owner.ownershipType === 'DIRECT' && ' - 25%+ ownership'}
              </span>
              {status.badge}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="eb-flex eb-items-center eb-gap-2">
            {owner.status === 'PENDING_HIERARCHY' && owner.ownershipType === 'INDIRECT' && (
              <Button
                size="sm"
                onClick={() => onBuildHierarchy(owner.id)}
                className="eb-bg-yellow-600 hover:eb-bg-yellow-700"
              >
                Build Ownership Hierarchy
              </Button>
            )}
            
            {owner.status === 'COMPLETE' && owner.ownershipType === 'INDIRECT' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditHierarchy(owner.id)}
              >
                <Edit className="eb-h-4 eb-w-4" />
                Edit Chain
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemoveOwner(owner.id)}
              className="eb-text-red-600 hover:eb-text-red-700 hover:eb-border-red-300"
            >
              <Trash2 className="eb-h-4 eb-w-4" />
              Remove Owner
            </Button>
          </div>
        )}
      </div>

      {/* Ownership Chain Visualization */}
      <div className="eb-space-y-2">
        {renderOwnershipChain(owner, rootCompanyName)}
        
        {/* Status Message */}
        {status.message && (
          <div className="eb-text-sm eb-text-gray-600 eb-italic">
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * OwnershipStructureList - Real-time display of all beneficial owners
 * 
 * Features:
 * - Real-time display of all added owners
 * - Status indicators (complete, pending, error)
 * - Quick actions (edit hierarchy, remove owner)
 * - Reuses existing AlternateOwnershipReview.renderOwnershipChain() for visualization
 */
export const OwnershipStructureList: React.FC<OwnershipStructureListProps> = ({
  owners,
  rootCompanyName,
  onBuildHierarchy,
  onEditHierarchy,
  onRemoveOwner,
  readOnly = false,
  className = '',
  testId = 'ownership-structure-list',
}) => {
  const { t } = useTranslation();

  // Separate owners by type
  const directOwners = owners.filter(owner => owner.ownershipType === 'DIRECT');
  const indirectOwners = owners.filter(owner => owner.ownershipType === 'INDIRECT');

  // Show empty state if no owners
  if (owners.length === 0) {
    return (
      <div 
        className={`eb-text-center eb-py-8 eb-text-gray-500 ${className}`}
        data-testid={testId}
      >
        <div className="eb-space-y-2">
          <User className="eb-h-12 eb-w-12 eb-mx-auto eb-text-gray-300" />
          <p className="eb-text-lg eb-font-medium">No beneficial owners added yet</p>
          <p className="eb-text-sm">Click "Add Individual Owner" to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`eb-space-y-6 ${className}`} data-testid={testId}>
      {/* Direct Owners Section */}
      {directOwners.length > 0 && (
        <div className="eb-space-y-3">
          <h4 className="eb-font-medium eb-flex eb-items-center eb-gap-2 eb-text-gray-900">
            <User className="eb-h-4 eb-w-4" />
            Direct Owners ({directOwners.length})
          </h4>
          <div className="eb-space-y-3">
            {directOwners.map((owner) => (
              <OwnerItem
                key={owner.id}
                owner={owner}
                rootCompanyName={rootCompanyName}
                onBuildHierarchy={onBuildHierarchy}
                onEditHierarchy={onEditHierarchy}
                onRemoveOwner={onRemoveOwner}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Indirect Owners Section */}
      {indirectOwners.length > 0 && (
        <div className="eb-space-y-3">
          <h4 className="eb-font-medium eb-flex eb-items-center eb-gap-2 eb-text-gray-900">
            <Building className="eb-h-4 eb-w-4" />
            Indirect Owners ({indirectOwners.length})
          </h4>
          <div className="eb-space-y-3">
            {indirectOwners.map((owner) => (
              <OwnerItem
                key={owner.id}
                owner={owner}
                rootCompanyName={rootCompanyName}
                onBuildHierarchy={onBuildHierarchy}
                onEditHierarchy={onEditHierarchy}
                onRemoveOwner={onRemoveOwner}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {owners.length > 0 && (
        <div className="eb-pt-4 eb-border-t eb-border-gray-200">
          <div className="eb-text-sm eb-text-gray-600">
            Total: {owners.length} beneficial owner{owners.length !== 1 ? 's' : ''} 
            {directOwners.length > 0 && ` (${directOwners.length} direct`}
            {indirectOwners.length > 0 && directOwners.length > 0 && `, ${indirectOwners.length} indirect`}
            {indirectOwners.length > 0 && directOwners.length === 0 && ` (${indirectOwners.length} indirect`}
            {(directOwners.length > 0 || indirectOwners.length > 0) && ')'}
          </div>
        </div>
      )}
    </div>
  );
};
