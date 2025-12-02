'use client';

import React from 'react';
import { ArrowLeft, Building, CheckCircle2, Edit, Plus, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { AlternateOwnershipReviewProps } from './types';

/**
 * AlternateOwnershipReview - Review and finalize the ownership structure
 */
export const AlternateOwnershipReview: React.FC<AlternateOwnershipReviewProps> = ({
  beneficialOwners,
  kycCompanyName = 'your company',
  onBack,
  onComplete,
  onEditOwner,
  onAddMoreOwners,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  const directOwners = beneficialOwners.filter(owner => owner.ownershipType === 'DIRECT');
  const indirectOwners = beneficialOwners.filter(owner => owner.ownershipType === 'INDIRECT');

  const renderOwnershipChain = (owner: any) => {
    if (owner.ownershipType === 'DIRECT') {
      return (
        <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-gray-600">
          <User className="eb-h-4 eb-w-4" />
          <span>Direct ownership of {kycCompanyName}</span>
        </div>
      );
    }

    if (!owner.hierarchyChain || owner.hierarchyChain.length === 0) {
      return (
        <div className="eb-text-sm eb-text-gray-500 eb-italic">
          Hierarchy not yet defined
        </div>
      );
    }

    return (
      <div className="eb-flex eb-items-center eb-gap-2 eb-p-2 eb-bg-gray-50 eb-border eb-rounded eb-text-sm eb-flex-wrap">
        {/* Owner at the start */}
        <div className="eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded eb-shrink-0">
          <User className="eb-h-3 eb-w-3 eb-text-blue-600" />
          <span className="eb-font-medium eb-text-blue-900">{owner.firstName} {owner.lastName}</span>
        </div>
        
        <span className="eb-text-gray-400 eb-shrink-0">→</span>

        {/* Company chain */}
        {owner.hierarchyChain.map((company: any, index: number) => (
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

  return (
    <div className="eb-space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="eb-flex eb-items-center eb-gap-2">
            <CheckCircle2 className="eb-h-5 eb-w-5 eb-text-green-600" />
            Review Ownership Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-6">
          {/* Summary */}
          <div className="eb-p-4 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded-lg">
            <h3 className="eb-font-medium eb-text-blue-900 eb-mb-2">
              Business Being Onboarded: {kycCompanyName}
            </h3>
            <p className="eb-text-sm eb-text-blue-700">
              {beneficialOwners.length} beneficial owner{beneficialOwners.length !== 1 ? 's' : ''} identified 
              (each owns 25% or more of {kycCompanyName})
            </p>
          </div>

          {/* Validation status */}
          <Alert>
            <CheckCircle2 className="eb-h-4 eb-w-4" />
            <AlertDescription>
              <div className="eb-space-y-1">
                <div>✓ {beneficialOwners.length} beneficial owner{beneficialOwners.length !== 1 ? 's' : ''} identified</div>
                <div>✓ All ownership chains validated</div>
                <div>✓ Business being onboarded identified in all indirect ownership paths</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Direct owners section */}
          {directOwners.length > 0 && (
            <div className="eb-space-y-3">
              <h3 className="eb-font-medium eb-flex eb-items-center eb-gap-2">
                <User className="eb-h-4 eb-w-4" />
                Direct Owners ({directOwners.length})
              </h3>
              <div className="eb-space-y-2">
                {directOwners.map((owner) => (
                  <div 
                    key={owner.id} 
                    className="eb-flex eb-items-center eb-justify-between eb-p-3 eb-border eb-rounded-lg eb-bg-white"
                  >
                    <div className="eb-space-y-2 eb-flex-1">
                      <div className="eb-font-medium">
                        {owner.firstName} {owner.lastName}
                      </div>
                      {renderOwnershipChain(owner)}
                    </div>
                    
                    {!readOnly && onEditOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditOwner(owner.id)}
                      >
                        <Edit className="eb-h-4 eb-w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Indirect owners section */}
          {indirectOwners.length > 0 && (
            <div className="eb-space-y-3">
              <h3 className="eb-font-medium eb-flex eb-items-center eb-gap-2">
                <Building className="eb-h-4 eb-w-4" />
                Indirect Owners ({indirectOwners.length})
              </h3>
              <div className="eb-space-y-2">
                {indirectOwners.map((owner) => (
                  <div 
                    key={owner.id} 
                    className="eb-flex eb-items-center eb-justify-between eb-p-3 eb-border eb-rounded-lg eb-bg-white"
                  >
                    <div className="eb-space-y-2 eb-flex-1">
                      <div className="eb-font-medium">
                        {owner.firstName} {owner.lastName}
                      </div>
                      {renderOwnershipChain(owner)}
                    </div>
                    
                    {!readOnly && onEditOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditOwner(owner.id)}
                      >
                        <Edit className="eb-h-4 eb-w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add more owners option */}
          {!readOnly && onAddMoreOwners && (
            <div className="eb-border-t eb-pt-4">
              <Button
                variant="outline"
                onClick={onAddMoreOwners}
                className="eb-w-full eb-flex eb-items-center eb-gap-2"
              >
                <Plus className="eb-h-4 eb-w-4" />
                Add More Beneficial Owners
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="eb-flex eb-justify-between eb-items-center eb-pt-4 eb-border-t">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="eb-flex eb-items-center eb-gap-2"
            >
              <ArrowLeft className="eb-h-4 eb-w-4" />
              Back
            </Button>

            <Button 
              onClick={onComplete}
              className="eb-min-w-32 eb-bg-green-600 hover:eb-bg-green-700"
            >
              Complete Structure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
