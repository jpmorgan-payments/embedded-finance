'use client';

import React from 'react';
import { Building, User } from 'lucide-react';

import type { BeneficialOwner } from '../../IndirectOwnership.types';

/**
 * Reusable ownership chain renderer - extracted from AlternateOwnershipReview
 * This maintains the exact same visual styling and behavior as the original
 */
export const renderOwnershipChain = (
  owner: BeneficialOwner,
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
  if (
    !owner.ownershipHierarchy ||
    !owner.ownershipHierarchy.steps ||
    owner.ownershipHierarchy.steps.length === 0
  ) {
    return (
      <div className="eb-text-sm eb-italic eb-text-gray-500">
        Hierarchy not yet defined
      </div>
    );
  }

  // Convert V2 hierarchy steps to the format expected by the original renderer
  const hierarchyChain = owner.ownershipHierarchy.steps
    .filter((step) => step.entityType === 'COMPANY')
    .sort((a, b) => a.level - b.level)
    .map((step) => ({
      id: step.id,
      companyName: step.entityName,
    }));

  return (
    <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-rounded eb-border eb-bg-gray-50 eb-p-2 eb-text-sm">
      {/* Owner at the start */}
      <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-blue-200 eb-bg-blue-50 eb-px-2 eb-py-1">
        <User className="eb-h-3 eb-w-3 eb-text-blue-600" />
        <span className="eb-font-medium eb-text-blue-900">
          {owner.firstName} {owner.lastName}
        </span>
      </div>

      <span className="eb-shrink-0 eb-text-gray-400">→</span>

      {/* Company chain */}
      {hierarchyChain.map((company) => (
        <React.Fragment key={company.id}>
          <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-bg-white eb-px-2 eb-py-1">
            <Building className="eb-h-3 eb-w-3 eb-text-gray-600" />
            <span className="eb-font-medium">{company.companyName}</span>
            <span className="eb-rounded eb-bg-green-100 eb-px-1 eb-py-0.5 eb-text-xs eb-text-green-700">
              Intermediary
            </span>
          </div>
          <span className="eb-shrink-0 eb-text-gray-400">→</span>
        </React.Fragment>
      ))}

      {/* Always show the business being onboarded at the end */}
      <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-green-200 eb-bg-green-50 eb-px-2 eb-py-1">
        <Building className="eb-h-3 eb-w-3 eb-text-green-600" />
        <span className="eb-font-medium eb-text-green-900">
          {kycCompanyName}
        </span>
        <span className="eb-rounded eb-bg-green-200 eb-px-1 eb-py-0.5 eb-text-xs eb-text-green-800">
          Business
        </span>
      </div>
    </div>
  );
};
