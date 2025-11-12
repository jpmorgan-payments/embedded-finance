'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building, Plus, AlertCircle, Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { IndirectOwnershipComponentProps } from './types/types';

/**
 * IndirectOwnership component for managing complex ownership structures
 * where companies are owned by other companies in a hierarchical chain
 * until reaching ultimate beneficial owners (individuals).
 */
export const IndirectOwnership: React.FC<IndirectOwnershipComponentProps> = ({
  clientId,
  onOwnershipStructureUpdate,
  showVisualization = true,
  maxDepth = 10,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  // TODO: Add loading and error states when API integration is implemented
  const isLoading = false;
  const isError = false;
  
  // Mock state to demonstrate different scenarios based on clientId
  const needsOwnershipInfo = clientId === 'needs-info-client-002';

  // Loading state
  if (isLoading) {
    return (
      <Card className="eb-component eb-w-full">
        <CardHeader>
          <div className="eb-flex eb-items-center eb-justify-between">
            <Skeleton className="eb-h-6 eb-w-48" />
            <Skeleton className="eb-h-10 eb-w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="eb-space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="eb-h-24 eb-w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="eb-component eb-w-full">
        <CardHeader>
          <CardTitle className="eb-text-xl eb-font-semibold">
            {t('indirectOwnership.title', 'Indirect Ownership Structure')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="eb-py-8 eb-text-center eb-text-red-500">
            {t('indirectOwnership.error', 'Failed to load ownership structure. Please try again.')}
            <Button
              variant="link"
              className="eb-ml-2 eb-h-auto eb-p-0"
              onClick={() => {
                // TODO: Implement refetch when API integration is added
                console.log('Refetch ownership data');
              }}
            >
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="eb-component eb-w-full">
      <CardHeader>
        <div className="eb-flex eb-items-center eb-justify-between">
          <CardTitle className="eb-text-xl eb-font-semibold">
            {t('indirectOwnership.title', 'Indirect Ownership Structure')}
          </CardTitle>
          {!readOnly && clientId && (
            <Button>
              <Plus className="eb-mr-2 eb-h-4 eb-w-4" />
              {t('indirectOwnership.addOwner', 'Add Owner')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="eb-space-y-4">
        {/* Information Requested Alert */}
        {needsOwnershipInfo && (
          <Alert className="eb-border-orange-200 eb-bg-orange-50">
            <AlertCircle className="eb-h-4 eb-w-4 eb-text-orange-600" />
            <AlertDescription className="eb-text-orange-800">
              <strong>Action Required:</strong> {t('indirectOwnership.infoRequested', 
                'Additional ownership information is needed to complete your application. Please provide complete beneficial ownership details.'
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {clientId && !needsOwnershipInfo ? (
          <div className="eb-py-8 eb-text-center">
            <div className="eb-mb-4">
              <Users className="eb-mx-auto eb-h-12 eb-w-12 eb-text-gray-400" />
            </div>
            <div className="eb-text-lg eb-font-medium eb-text-gray-900">
              {t('indirectOwnership.emptyState.title', 'No Ownership Structure Defined')}
            </div>
            <div className="eb-mt-2 eb-text-sm eb-text-gray-500">
              {t('indirectOwnership.emptyState.description', 
                'Start building your ownership structure by adding entities and individuals that have ownership interest in your company.'
              )}
            </div>
          </div>
        ) : (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            <div className="eb-mb-4">
              <Building className="eb-mx-auto eb-h-12 eb-w-12 eb-text-gray-400" />
            </div>
            <div className="eb-text-lg eb-font-medium">
              {t('indirectOwnership.placeholder', 'Indirect Ownership Component')}
            </div>
            <div className="eb-mt-2 eb-text-sm">
              {t('indirectOwnership.description', 
                'This component handles complex ownership structures where entities own other entities.'
              )}
            </div>
          </div>
        )}
        
        {/* Empty State Actions or Component Placeholders */}
        {clientId && !readOnly ? (
          <div className="eb-text-center eb-space-y-4">
            <div className="eb-text-sm eb-text-gray-500">
              {t('indirectOwnership.emptyState.getStarted', 'Get started by adding your first entity or individual owner')}
            </div>
            <div className="eb-flex eb-justify-center eb-gap-3">
              <Button 
                onClick={() => {
                  // TODO: Implement add entity functionality
                  console.log('Add entity');
                }}
              >
                <Building className="eb-mr-2 eb-h-4 eb-w-4" />
                {t('indirectOwnership.emptyState.addEntity', 'Add Entity')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Implement add individual functionality
                  console.log('Add individual');
                }}
              >
                <Users className="eb-mr-2 eb-h-4 eb-w-4" />
                {t('indirectOwnership.emptyState.addIndividual', 'Add Individual')}
              </Button>
            </div>
          </div>
        ) : clientId && readOnly ? (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            <div className="eb-mb-4">
              <Users className="eb-mx-auto eb-h-8 eb-w-8 eb-text-gray-400" />
            </div>
            <div className="eb-text-sm">
              {t('indirectOwnership.readOnly', 'Ownership structure is in read-only mode')}
            </div>
          </div>
        ) : !clientId ? (
          <div className="eb-grid eb-gap-4">
            <div className="eb-rounded-lg eb-border-2 eb-border-dashed eb-border-gray-200 eb-p-4">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium eb-text-gray-600">
                <Users className="eb-h-4 eb-w-4" />
                {t('indirectOwnership.components.ownershipTree', 'Ownership Tree Visualization')}
              </div>
              <div className="eb-mt-1 eb-text-xs eb-text-gray-500">
                {t('indirectOwnership.components.ownershipTreeDesc', 'Interactive hierarchy showing ownership relationships')}
              </div>
            </div>
            
            <div className="eb-rounded-lg eb-border-2 eb-border-dashed eb-border-gray-200 eb-p-4">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium eb-text-gray-600">
                <Building className="eb-h-4 eb-w-4" />
                {t('indirectOwnership.components.entityForm', 'Entity/Individual Forms')}
              </div>
              <div className="eb-mt-1 eb-text-xs eb-text-gray-500">
                {t('indirectOwnership.components.entityFormDesc', 'Dynamic forms for adding parties to ownership structure')}
              </div>
            </div>
            
            <div className="eb-rounded-lg eb-border-2 eb-border-dashed eb-border-gray-200 eb-p-4">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium eb-text-gray-600">
                <Badge variant="outline" className="eb-text-xs">
                  25%
                </Badge>
                {t('indirectOwnership.components.validationSummary', 'Ownership Validation')}
              </div>
              <div className="eb-mt-1 eb-text-xs eb-text-gray-500">
                {t('indirectOwnership.components.validationSummaryDesc', 'Compliance checks and beneficial owner identification')}
              </div>
            </div>
          </div>
        ) : null}

        {/* Beneficial Ownership Information */}
        {clientId && !readOnly && (
          <Alert className="eb-border-blue-200 eb-bg-blue-50">
            <Info className="eb-h-4 eb-w-4 eb-text-blue-600" />
            <AlertDescription className="eb-text-blue-800 eb-text-sm">
              <strong>Beneficial Ownership:</strong> {t('indirectOwnership.beneficialOwnershipInfo', 
                'You must identify all individuals who own 25% or more of your company, directly or indirectly through other entities.'
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="eb-mt-6 eb-rounded-lg eb-border eb-bg-gray-50 eb-p-3">
            <div className="eb-text-xs eb-font-mono eb-text-gray-600">
              <div className="eb-mb-1 eb-font-semibold eb-text-gray-800">Debug Info:</div>
              <div>Client ID: <span className="eb-text-blue-600">{clientId || 'Not provided'}</span></div>
              <div>Show Visualization: <span className="eb-text-blue-600">{showVisualization ? 'Yes' : 'No'}</span></div>
              <div>Max Depth: <span className="eb-text-blue-600">{maxDepth}</span></div>
              <div>Read Only: <span className="eb-text-blue-600">{readOnly ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
