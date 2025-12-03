'use client';

import React from 'react';
import { User, Building } from 'lucide-react';

import type { V2BeneficialOwner } from '../V2AlternateIndirectOwnership/types';

/**
 * Reusable ownership chain renderer - extracted from AlternateOwnershipReview
 * This maintains the exact same visual styling and behavior as the original
 */
export const renderOwnershipChain = (
  owner: V2BeneficialOwner, 
  kycCompanyName: string
) => {
  if (owner.ownershipType === 'DIRECT') {
    return (
      <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-gray-600">
        <User className="eb-h-4 eb-w-4" />
        <span>Direct ownership of {kycCompanyName}</span>
      </div>
    );
  }

  // For indirect owners, check if hierarchy exists
  if (!owner.ownershipHierarchy || !owner.ownershipHierarchy.steps || owner.ownershipHierarchy.steps.length === 0) {
    return (
      <div className="eb-text-sm eb-text-gray-500 eb-italic">
        Hierarchy not yet defined
      </div>
    );
  }

  // Convert V2 hierarchy steps to the format expected by the original renderer
  const hierarchyChain = owner.ownershipHierarchy.steps
    .filter(step => step.entityType === 'COMPANY' && !step.isBusinessBeingOnboarded)
    .sort((a, b) => a.level - b.level)
    .map(step => ({
      id: step.id,
      companyName: step.entityName,
    }));

  return (
    <div className="eb-flex eb-items-center eb-gap-2 eb-p-2 eb-bg-gray-50 eb-border eb-rounded eb-text-sm eb-flex-wrap">
      {/* Owner at the start */}
      <div className="eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded eb-shrink-0">
        <User className="eb-h-3 eb-w-3 eb-text-blue-600" />
        <span className="eb-font-medium eb-text-blue-900">{owner.firstName} {owner.lastName}</span>
      </div>
      
      <span className="eb-text-gray-400 eb-shrink-0">→</span>

      {/* Company chain */}
      {hierarchyChain.map((company, index) => (
        <React.Fragment key={company.id}>
          <div className="eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-bg-white eb-border eb-rounded eb-shrink-0">
            <Building className="eb-h-3 eb-w-3 eb-text-gray-600" />
            <span className="eb-font-medium">{company.companyName}</span>
            <span className="eb-text-xs eb-px-1 eb-py-0.5 eb-bg-green-100 eb-text-green-700 eb-rounded">
              Intermediary
            </span>
          </div>
          <span className="eb-text-gray-400 eb-shrink-0">→</span>
        </React.Fragment>
      ))}
      
      {/* Always show the business being onboarded at the end */}
      <div className="eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-bg-green-50 eb-border eb-border-green-200 eb-rounded eb-shrink-0">
        <Building className="eb-h-3 eb-w-3 eb-text-green-600" />
        <span className="eb-font-medium eb-text-green-900">{kycCompanyName}</span>
        <span className="eb-text-xs eb-px-1 eb-py-0.5 eb-bg-green-200 eb-text-green-800 eb-rounded">
          Business
        </span>
      </div>
    </div>
  );
};
