'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building, Plus, AlertCircle, Info, ChevronRight, UserPlus, ArrowRight, User, CheckCircle2 } from 'lucide-react';

import { useSmbdoGetClient } from '@/api/generated/smbdo';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Removed tabs import due to missing dependency - using button-based toggle instead

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

  // Dialog state
  const [isAddOwnerDialogOpen, setIsAddOwnerDialogOpen] = React.useState(false);
  const [selectedParent, setSelectedParent] = React.useState<any>(null);
  const [ownerType, setOwnerType] = React.useState<'entity' | 'individual' | null>(null);

  // Local state for ownership data (overrides API data when modified)
  const [localOwnershipData, setLocalOwnershipData] = React.useState<any>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = React.useState('full-structure');

  // Form state
  const [formData, setFormData] = React.useState({
    // Individual fields
    firstName: '',
    lastName: '',
    middleName: '',
    // Entity fields
    organizationName: '',
    organizationType: '',
    countryOfFormation: 'US',
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isAddOwnerDialogOpen) {
      setOwnerType(null);
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        organizationName: '',
        organizationType: '',
        countryOfFormation: 'US',
      });
    }
  }, [isAddOwnerDialogOpen]);

  // Fetch client data using SMBDO API
  const { 
    data: clientData, 
    isLoading, 
    isError 
  } = useSmbdoGetClient(clientId!, {
    query: {
      enabled: !!clientId,
    },
  });

  // Use local ownership data if available, otherwise use API data
  const currentOwnershipData = localOwnershipData || clientData;

  // Check if client needs ownership information
  const needsOwnershipInfo = currentOwnershipData?.status === 'INFORMATION_REQUESTED' || 
    currentOwnershipData?.parties?.[0]?.profileStatus === 'INFORMATION_REQUESTED';

  // Check if client has ownership structure (parties beyond the root client)
  const hasOwnershipStructure = currentOwnershipData?.parties && currentOwnershipData.parties.length > 1;

  // Build ownership tree from parties data
  const buildOwnershipTree = () => {
    if (!currentOwnershipData?.parties) return [];

    const rootParty = currentOwnershipData.parties.find((p: any) => p.roles?.includes('CLIENT'));
    if (!rootParty) return [];

    const getChildren = (parentId: string, currentDepth = 0): any[] => {
      if (currentDepth >= maxDepth || !currentOwnershipData?.parties) return [];
      
      return currentOwnershipData.parties
        .filter((p: any) => p.parentPartyId === parentId)
        .map((party: any) => ({
          ...party,
          children: party.id ? getChildren(party.id, currentDepth + 1) : []
        }));
    };

    return [{
      ...rootParty,
      children: rootParty.id ? getChildren(rootParty.id) : []
    }];
  };

  const ownershipTree = buildOwnershipTree();





  // Calculate beneficial owners grouped by direct and indirect
  const calculateBeneficialOwners = () => {
    if (!currentOwnershipData?.parties) return { direct: [], indirect: [] };

    const rootParty = currentOwnershipData.parties.find((p: any) => p.roles?.includes('CLIENT'));
    if (!rootParty?.id) return { direct: [], indirect: [] };

    const directOwners: Array<{
      party: any;
      chainDescription: string;
    }> = [];

    const indirectOwners: Array<{
      party: any;
      chainDescription: string;
    }> = [];

    // Find all individuals who are beneficial owners
    const individuals = currentOwnershipData.parties.filter(
      (p: any) => p.partyType === 'INDIVIDUAL' && p.roles?.includes('BENEFICIAL_OWNER')
    );

    individuals.forEach((individual: any) => {
      const individualName = `${individual.individualDetails?.firstName || ''} ${individual.individualDetails?.lastName || ''}`.trim();
      
      // Check if this is a direct owner (parent is the client entity)
      const isDirect = individual.parentPartyId === rootParty.id;
      
      if (isDirect) {
        // Direct owner - simple description
        directOwners.push({
          party: individual,
          chainDescription: `${individualName || 'Unnamed Individual'} directly owns the client entity`
        });
      } else {
        // Indirect owner - build ownership chain description
        const chain: Array<{ name: string; id: string }> = [];
        let currentPartyId = individual.parentPartyId;

        // Traverse up the ownership chain to build the path
        while (currentPartyId && currentPartyId !== rootParty.id) {
          const parentParty = currentOwnershipData.parties.find((p: any) => p.id === currentPartyId);
          if (!parentParty) break;

          const parentName = parentParty.partyType === 'ORGANIZATION'
            ? parentParty.organizationDetails?.organizationName
            : `${parentParty.individualDetails?.firstName || ''} ${parentParty.individualDetails?.lastName || ''}`.trim();

          chain.push({
            name: parentName || 'Unnamed Entity',
            id: parentParty.id
          });

          currentPartyId = parentParty.parentPartyId;
        }

        // Build chain description (reverse to show from individual to client)
        let chainDescription = `${individualName || 'Unnamed Individual'}`;
        
        if (chain.length > 0) {
          chain.reverse(); // Show from individual outward
          chainDescription += ` owns ${chain[0].name}`;
          
          for (let i = 1; i < chain.length; i++) {
            chainDescription += ` which owns ${chain[i].name}`;
          }
        }

        indirectOwners.push({
          party: individual,
          chainDescription
        });
      }
    });

    return { direct: directOwners, indirect: indirectOwners };
  };

  const beneficialOwners = calculateBeneficialOwners();

  // Validation functions
  const validateOwnershipStructure = () => {
    const errors: Array<{ type: string; message: string; partyId?: string }> = [];
    
    if (!currentOwnershipData?.parties) return errors;

    // Validation 1: Check for entity nodes without individual children (incomplete beneficial ownership)
    const entities = currentOwnershipData.parties.filter((p: any) => 
      p.partyType === 'ORGANIZATION' && p.roles?.includes('BENEFICIAL_OWNER')
    );

    entities.forEach((entity: any) => {
      const hasIndividualChildren = currentOwnershipData.parties.some((p: any) => 
        p.parentPartyId === entity.id && p.partyType === 'INDIVIDUAL'
      );
      
      if (!hasIndividualChildren) {
        // Build ownership lineage path from root client to this entity
        const buildLineagePath = (targetEntityId: string): string[] => {
          const path: string[] = [];
          let currentPartyId = targetEntityId;
          
          while (currentPartyId) {
            const party = currentOwnershipData.parties.find((p: any) => p.id === currentPartyId);
            if (!party) break;
            
            const name = party.partyType === 'ORGANIZATION'
              ? party.organizationDetails?.organizationName || 'Unnamed Entity'
              : `${party.individualDetails?.firstName || ''} ${party.individualDetails?.lastName || ''}`.trim() || 'Unnamed Individual';
            
            path.unshift(name);
            currentPartyId = party.parentPartyId;
          }
          
          return path;
        };
        
        const lineagePath = buildLineagePath(entity.id);
        const entityName = entity.organizationDetails?.organizationName || 'Entity';
        
        // Create descriptive error message with ownership chain
        let errorMessage: string;
        if (lineagePath.length <= 2) {
          // Direct child of client (simple case)
          errorMessage = `${entityName} does not have identified beneficial owners`;
        } else {
          // Nested entity (show full path)
          const pathDescription = lineagePath.join(' → ');
          errorMessage = `${entityName} does not have identified beneficial owners (ownership path: ${pathDescription})`;
        }
        
        errors.push({
          type: 'INCOMPLETE_BENEFICIAL_OWNERSHIP',
          message: errorMessage,
          partyId: entity.id
        });
      }
    });

    // Validation 2: Check for more than 4 natural persons (mathematical limit for 25%+ ownership)
    const individuals = currentOwnershipData.parties.filter((p: any) => 
      p.partyType === 'INDIVIDUAL' && p.roles?.includes('BENEFICIAL_OWNER')
    );

    if (individuals.length > 4) {
      errors.push({
        type: 'TOO_MANY_BENEFICIAL_OWNERS',
        message: `Cannot have more than 4 beneficial owners (currently ${individuals.length}). Each must own at least 25%.`,
      });
    }

    return errors;
  };

  const validationErrors = validateOwnershipStructure();
  const canAddMoreOwners = () => {
    const individuals = currentOwnershipData?.parties?.filter((p: any) => 
      p.partyType === 'INDIVIDUAL' && p.roles?.includes('BENEFICIAL_OWNER')
    ) || [];
    return individuals.length < 4;
  };

  // Count beneficial owners for a given party
  const countBeneficialOwners = (party: any): number => {
    if (!party.children || party.children.length === 0) return 0;
    
    let count = 0;
    party.children.forEach((child: any) => {
      if (child.roles?.includes('BENEFICIAL_OWNER')) {
        count++;
      }
      count += countBeneficialOwners(child); // Recursively count nested owners
    });
    
    return count;
  };

  // Handle adding an owner to a specific party
  const handleAddOwner = (parentParty: any) => {
    setSelectedParent(parentParty);
    setIsAddOwnerDialogOpen(true);
  };

  // Handle form submission
  const handleSubmitOwner = () => {
    if (!selectedParent || !ownerType || !currentOwnershipData) return;

    // Validation: Check if we're trying to add a 5th individual
    if (ownerType === 'individual' && !canAddMoreOwners()) {
      alert('Cannot add more than 4 beneficial owners. Each beneficial owner must own at least 25% of the entity.');
      return;
    }

    const newOwner = {
      id: `party-${Date.now()}`, // Generate temporary ID
      partyType: ownerType === 'entity' ? 'ORGANIZATION' : 'INDIVIDUAL',
      externalId: `NEW${Date.now()}`,
      email: ownerType === 'entity' ? `contact@${formData.organizationName.toLowerCase().replace(/\s+/g, '')}.com` : `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@email.com`,
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'NEW',
      active: true,
      createdAt: new Date().toISOString(),
      parentPartyId: selectedParent.id,
      ...(ownerType === 'entity' ? {
        organizationDetails: {
          organizationType: formData.organizationType,
          organizationName: formData.organizationName,
          countryOfFormation: formData.countryOfFormation,
        }
      } : {
        individualDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || undefined,
        }
      })
    };

    // Update local ownership data by adding the new owner to the parties array
    const updatedOwnershipData = {
      ...currentOwnershipData,
      parties: [
        ...currentOwnershipData.parties,
        newOwner
      ]
    };

    // Update local state to immediately reflect the change
    setLocalOwnershipData(updatedOwnershipData);



    console.log('Adding new owner:', newOwner);

    // Call the callback with updated ownership structure
    if (onOwnershipStructureUpdate) {
      const updatedOwnership = {
        ...currentOwnershipData,
        parties: [...(currentOwnershipData.parties || []), newOwner]
      };
      onOwnershipStructureUpdate(updatedOwnership);
    }

    // Close dialog
    setIsAddOwnerDialogOpen(false);
  };

  // Render a single party in the ownership tree
  const renderParty = (party: any, depth = 0) => {
    const isOrganization = party.partyType === 'ORGANIZATION';
    const name = isOrganization 
      ? party.organizationDetails?.organizationName
      : `${party.individualDetails?.firstName || ''} ${party.individualDetails?.lastName || ''}`.trim();
    
    const isBeneficialOwner = party.roles?.includes('BENEFICIAL_OWNER');
    const isClient = party.roles?.includes('CLIENT');
    const beneficialOwnerCount = countBeneficialOwners(party);
    const hasChildren = party.children && party.children.length > 0;
    
    // Check if this entity needs beneficial owner identification
    const needsBeneficialOwner = isOrganization && 
      party.roles?.includes('BENEFICIAL_OWNER') && 
      !currentOwnershipData?.parties?.some((p: any) => 
        p.parentPartyId === party.id && p.partyType === 'INDIVIDUAL'
      );
    
    const hasValidationError = validationErrors.some(error => error.partyId === party.id);

    // If this party has children, wrap in accordion
    if (hasChildren) {
      // Count direct children only (not nested)
      const directBeneficialOwnerCount = party.children.filter((child: any) => 
        child.roles?.includes('BENEFICIAL_OWNER')
      ).length;

      // Determine default value - only open for root level (depth 0)
      const defaultValue = depth === 0 ? "open" : undefined;

      return (
        <div key={party.id} className="eb-mb-2">
          <Accordion type="single" collapsible defaultValue={defaultValue}>
            <AccordionItem value="open" className="eb-border eb-border-gray-200 eb-rounded-lg">
              <AccordionTrigger className="eb-px-3 sm:eb-px-4 eb-py-3 hover:eb-no-underline hover:eb-bg-gray-50 eb-rounded-t-lg">
                <div className="eb-flex eb-items-center eb-justify-between eb-w-full eb-mr-2">
                  {/* Mobile Layout - Stacked */}
                  <div className="eb-block sm:eb-hidden eb-w-full">
                    <div className="eb-flex eb-items-center eb-space-x-3 eb-mb-2">
                      {isOrganization ? (
                        <Building className="eb-h-5 eb-w-5 eb-text-blue-600 eb-flex-shrink-0" />
                      ) : (
                        <Users className="eb-h-5 eb-w-5 eb-text-green-600 eb-flex-shrink-0" />
                      )}
                      <div className="eb-flex-1 eb-min-w-0">
                        <div className="eb-font-medium eb-truncate eb-text-left">{name || 'Unnamed Entity'}</div>
                      </div>

                    </div>
                    <div className="eb-flex eb-flex-wrap eb-gap-2 eb-text-sm eb-text-left">
                      <span className="eb-text-gray-600">
                        {isOrganization 
                          ? party.organizationDetails?.organizationType 
                          : 'Individual'}
                      </span>
                      {isClient && (
                        <Badge variant="secondary" className="eb-text-xs">Client</Badge>
                      )}
                      {isBeneficialOwner && (
                        <Badge variant="outline" className="eb-text-xs">Beneficial Owner</Badge>
                      )}
                      <Badge variant="secondary" className="eb-text-xs eb-bg-blue-100 eb-text-blue-800">
                        {directBeneficialOwnerCount} Direct Owner{directBeneficialOwnerCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Desktop Layout - Single Line */}
                  <div className="eb-hidden sm:eb-flex eb-items-center eb-justify-between eb-w-full">
                    <div className="eb-flex eb-items-center eb-space-x-3 eb-flex-1 eb-min-w-0">
                      {isOrganization ? (
                        <Building className="eb-h-5 eb-w-5 eb-text-blue-600 eb-flex-shrink-0" />
                      ) : (
                        <Users className="eb-h-5 eb-w-5 eb-text-green-600 eb-flex-shrink-0" />
                      )}
                      <div className="eb-flex-1 eb-min-w-0">
                        <span className="eb-font-medium eb-truncate eb-block eb-text-left">{name || 'Unnamed Entity'}</span>
                      </div>
                      <div className="eb-text-sm eb-text-gray-600 eb-flex-shrink-0">
                        {isOrganization 
                          ? party.organizationDetails?.organizationType 
                          : 'Individual'}
                      </div>
                    </div>
                    
                    <div className="eb-flex eb-items-center eb-space-x-2 eb-flex-shrink-0">

                      {isClient && (
                        <Badge variant="secondary" className="eb-text-xs">Client</Badge>
                      )}
                      {isBeneficialOwner && (
                        <Badge variant="outline" className="eb-text-xs">Beneficial Owner</Badge>
                      )}
                      <Badge variant="secondary" className="eb-text-xs eb-bg-blue-100 eb-text-blue-800">
                        {directBeneficialOwnerCount} Direct Owner{directBeneficialOwnerCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="eb-px-3 sm:eb-px-4 eb-pb-3">
                <div className="eb-space-y-2 eb-pt-2">
                  {party.children.map((child: any) => renderParty(child, depth + 1))}
                  
                  {/* Add Owner Button */}
                  {!readOnly && (
                    <div className="eb-pt-2 eb-border-t eb-border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddOwner(party)}
                        disabled={ownerType === 'individual' && !canAddMoreOwners()}
                        className="eb-w-full sm:eb-w-auto eb-text-sm"
                      >
                        <Plus className="eb-mr-2 eb-h-4 eb-w-4" />
                        {t('indirectOwnership.addOwnership', 'Add Ownership')}
                      </Button>
                      {!canAddMoreOwners() && (
                        <p className="eb-text-xs eb-text-orange-600 eb-mt-1">
                          Maximum of 4 beneficial owners reached
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      );
    }

    // If no children, render as a simple card (leaf node)
    return (
      <div key={party.id}>
        <Card className={`eb-mb-2 eb-border hover:eb-border-gray-300 eb-transition-colors ${
          hasValidationError ? 'eb-border-orange-300 eb-bg-orange-50' : 'eb-border-gray-200'
        }`}>
          <CardContent className="eb-p-3 sm:eb-p-4">
            {/* Mobile Layout - Stacked */}
            <div className="eb-block sm:eb-hidden">
              <div className="eb-flex eb-items-center eb-space-x-3 eb-mb-2">
                {isOrganization ? (
                  <Building className="eb-h-5 eb-w-5 eb-text-blue-600 eb-flex-shrink-0" />
                ) : (
                  <Users className="eb-h-5 eb-w-5 eb-text-green-600 eb-flex-shrink-0" />
                )}
                <div className="eb-flex-1 eb-min-w-0">
                  <div className="eb-font-medium eb-truncate">{name || 'Unnamed Entity'}</div>
                </div>

              </div>
              <div className="eb-flex eb-flex-wrap eb-gap-2 eb-text-sm eb-items-center">
                <span className="eb-text-gray-600">
                  {isOrganization 
                    ? party.organizationDetails?.organizationType 
                    : 'Individual'}
                </span>
                {isClient && (
                  <Badge variant="secondary" className="eb-text-xs">Client</Badge>
                )}
                {isBeneficialOwner && (
                  <Badge variant="outline" className="eb-text-xs">Beneficial Owner</Badge>
                )}
                {needsBeneficialOwner && (
                  <Badge variant="default" className="eb-bg-orange-100 eb-text-orange-800 eb-text-xs">
                    Needs Individual Owner
                  </Badge>
                )}
                {/* Add Owner Button for Mobile - Organizations Only */}
                {!readOnly && isOrganization && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddOwner(party)}
                    className="eb-h-6 eb-px-2 eb-text-xs eb-ml-auto"
                  >
                    <Plus className="eb-h-3 eb-w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Layout - Single Line */}
            <div className="eb-hidden sm:eb-flex eb-items-center eb-justify-between eb-gap-4">
              <div className="eb-flex eb-items-center eb-space-x-3 eb-flex-1 eb-min-w-0">
                {isOrganization ? (
                  <Building className="eb-h-5 eb-w-5 eb-text-blue-600 eb-flex-shrink-0" />
                ) : (
                  <Users className="eb-h-5 eb-w-5 eb-text-green-600 eb-flex-shrink-0" />
                )}
                <div className="eb-flex-1 eb-min-w-0">
                  <span className="eb-font-medium eb-truncate eb-block">{name || 'Unnamed Entity'}</span>
                </div>
                <div className="eb-text-sm eb-text-gray-600 eb-flex-shrink-0">
                  {isOrganization 
                    ? party.organizationDetails?.organizationType 
                    : 'Individual'}
                </div>
              </div>
              
              <div className="eb-flex eb-items-center eb-space-x-2 eb-flex-shrink-0">

                {isClient && (
                  <Badge variant="secondary" className="eb-text-xs">Client</Badge>
                )}
                {isBeneficialOwner && (
                  <Badge variant="outline" className="eb-text-xs">Beneficial Owner</Badge>
                )}
                {needsBeneficialOwner && (
                  <Badge variant="default" className="eb-bg-orange-100 eb-text-orange-800 eb-text-xs">
                    Needs Individual Owner
                  </Badge>
                )}
                {/* Add Owner Button for Desktop - Organizations Only */}
                {!readOnly && isOrganization && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddOwner(party)}
                    className="eb-h-7 eb-px-2 eb-text-xs"
                  >
                    <Plus className="eb-mr-1 eb-h-3 eb-w-3" />
                    {t('indirectOwnership.addOwnership', 'Add Ownership')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="eb-border-red-200 eb-bg-red-50 eb-mb-4">
            <AlertCircle className="eb-h-4 eb-w-4 eb-text-red-600" />
            <AlertDescription className="eb-text-red-800">
              <strong>Ownership Structure Issues:</strong>
              <ul className="eb-mt-2 eb-space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="eb-text-sm">• {error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Two-Tab Navigation */}
        <div className="eb-border-b eb-border-gray-200 eb-mb-4">
          <nav className="eb-flex eb-space-x-8">
            <button
              onClick={() => setActiveTab('full-structure')}
              className={`eb-py-2 eb-px-1 eb-border-b-2 eb-font-medium eb-text-sm eb-transition-colors eb-duration-200 ${
                activeTab === 'full-structure'
                  ? 'eb-border-orange-500 eb-text-orange-600'
                  : 'eb-border-transparent eb-text-gray-500 hover:eb-text-gray-700 hover:eb-border-gray-300'
              }`}
            >
              {t('indirectOwnership.tabs.fullStructure', 'Full Structure')}
            </button>
            <button
              onClick={() => setActiveTab('beneficial-owners')}
              className={`eb-py-2 eb-px-1 eb-border-b-2 eb-font-medium eb-text-sm eb-transition-colors eb-duration-200 ${
                activeTab === 'beneficial-owners'
                  ? 'eb-border-orange-500 eb-text-orange-600'
                  : 'eb-border-transparent eb-text-gray-500 hover:eb-text-gray-700 hover:eb-border-gray-300'
              }`}
            >
              {t('indirectOwnership.tabs.beneficialOwners', 'Beneficial Owners')}
            </button>
          </nav>
        </div>

        {/* Full Structure Content */}
        {activeTab === 'full-structure' && (
          <div className="eb-space-y-4">

            {/* Ownership Structure Display */}
            {hasOwnershipStructure && !needsOwnershipInfo ? (
              <div className="eb-space-y-4">
                <div className="eb-flex eb-items-center eb-justify-between">
                  <h3 className="eb-text-lg eb-font-medium">
                    {t('indirectOwnership.structure.title', 'Ownership Hierarchy')}
                  </h3>
                  <Badge variant="outline">
                    {currentOwnershipData?.parties?.length || 0} {t('indirectOwnership.structure.parties', 'Parties')}
                  </Badge>
                </div>
                
                {showVisualization && (
                  <Alert>
                    <Info className="eb-h-4 eb-w-4" />
                    <AlertDescription>
                      {t('indirectOwnership.structure.description', 
                        'This shows the complete ownership hierarchy from your organization down to individual beneficial owners.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="eb-space-y-2">
                  {ownershipTree.map(party => renderParty(party))}
                </div>
              </div>
            ) : !hasOwnershipStructure && !needsOwnershipInfo ? (
              <div className="eb-space-y-4">
                <div className="eb-flex eb-items-center eb-justify-between">
                  <h3 className="eb-text-lg eb-font-medium">
                    {t('indirectOwnership.structure.title', 'Ownership Hierarchy')}
                  </h3>
                  <Badge variant="outline">
                    {currentOwnershipData?.parties?.length || 0} {t('indirectOwnership.structure.parties', 'Parties')}
                  </Badge>
                </div>
                
                {showVisualization && (
                  <Alert>
                    <Info className="eb-h-4 eb-w-4" />
                    <AlertDescription>
                      {t('indirectOwnership.structure.description', 
                        'This shows your organization. Add entities and individuals that have ownership interest in your company.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="eb-space-y-2">
                  {ownershipTree.map(party => renderParty(party))}
                </div>
              </div>
            ) : null}
          </div>
        )}


        {/* Beneficial Owners Content */}
        {activeTab === 'beneficial-owners' && (
          <div className="eb-space-y-4">
            <div className="eb-flex eb-items-center eb-justify-between">
              <h3 className="eb-text-lg eb-font-medium">
                {t('indirectOwnership.beneficialOwners.title', 'Beneficial Owners')}
              </h3>
              <Badge variant="outline">
                {beneficialOwners.direct.length + beneficialOwners.indirect.length} {t('indirectOwnership.beneficialOwners.count', (beneficialOwners.direct.length + beneficialOwners.indirect.length) === 1 ? 'Individual' : 'Individuals')}
              </Badge>
            </div>

            <Alert>
              <Info className="eb-h-4 eb-w-4" />
              <AlertDescription>
                {t('indirectOwnership.beneficialOwners.description', 
                  'These are natural persons (individuals) who ultimately own or control your organization through both direct and indirect ownership chains.'
                )}
              </AlertDescription>
            </Alert>

            {beneficialOwners.direct.length + beneficialOwners.indirect.length > 0 ? (
              <div className="eb-space-y-6">
                {/* Direct Owners Section */}
                {beneficialOwners.direct.length > 0 && (
                  <div>
                    <div className="eb-flex eb-items-center eb-gap-3 eb-mb-4">
                      <h4 className="eb-text-lg eb-font-semibold eb-text-gray-900">
                        {t('indirectOwnership.beneficialOwners.directSection', 'Direct Owners')}
                      </h4>
                      <span className="eb-px-2 eb-py-1 eb-text-xs eb-font-medium eb-bg-blue-100 eb-text-blue-800 eb-rounded-full">
                        {beneficialOwners.direct.length}
                      </span>
                    </div>
                    <div className="eb-space-y-3">
                      {beneficialOwners.direct.map((directOwner, index) => {
                        const individual = directOwner.party;
                        const individualName = `${individual.individualDetails?.firstName || ''} ${individual.individualDetails?.lastName || ''}`.trim();
                        
                        return (
                          <Card key={`direct-${individual.id}-${index}`} className="eb-border eb-border-gray-200">
                            <CardContent className="eb-p-4">
                              <div className="eb-flex eb-items-start eb-justify-between eb-gap-4">
                                <div className="eb-flex eb-items-start eb-gap-3 eb-flex-1">
                                  <User className="eb-h-5 eb-w-5 eb-text-blue-600 eb-flex-shrink-0 eb-mt-0.5" />
                                  <div className="eb-flex-1">
                                    <div className="eb-flex eb-items-center eb-gap-2 eb-mb-2">
                                      <h4 className="eb-font-medium eb-text-gray-900">
                                        {individualName || 'Unnamed Individual'}
                                      </h4>
                                      <span className="eb-inline-flex eb-items-center eb-px-2.5 eb-py-0.5 eb-rounded-full eb-text-xs eb-font-medium eb-bg-blue-100 eb-text-blue-800">
                                        {t('indirectOwnership.beneficialOwners.directLabel', 'Direct')}
                                      </span>
                                    </div>
                                    <p className="eb-text-sm eb-text-gray-600">
                                      {directOwner.chainDescription}
                                    </p>
                                  </div>
                                </div>
                                <div className="eb-flex eb-items-center eb-gap-2">
                                  <CheckCircle2 className="eb-h-4 eb-w-4 eb-text-green-500" />
                                  <span className="eb-text-xs eb-text-gray-500">
                                    {t('indirectOwnership.beneficialOwners.verified', 'Verified')}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Indirect Owners Section */}
                {beneficialOwners.indirect.length > 0 && (
                  <div>
                    <div className="eb-flex eb-items-center eb-gap-3 eb-mb-4">
                      <h4 className="eb-text-lg eb-font-semibold eb-text-gray-900">
                        {t('indirectOwnership.beneficialOwners.indirectSection', 'Indirect Owners')}
                      </h4>
                      <span className="eb-px-2 eb-py-1 eb-text-xs eb-font-medium eb-bg-orange-100 eb-text-orange-800 eb-rounded-full">
                        {beneficialOwners.indirect.length}
                      </span>
                    </div>
                    <div className="eb-space-y-3">
                      {beneficialOwners.indirect.map((indirectOwner, index) => {
                        const individual = indirectOwner.party;
                        const individualName = `${individual.individualDetails?.firstName || ''} ${individual.individualDetails?.lastName || ''}`.trim();
                        
                        return (
                          <Card key={`indirect-${individual.id}-${index}`} className="eb-border eb-border-gray-200">
                            <CardContent className="eb-p-4">
                              <div className="eb-flex eb-items-start eb-justify-between eb-gap-4">
                                <div className="eb-flex eb-items-start eb-gap-3 eb-flex-1">
                                  <Users className="eb-h-5 eb-w-5 eb-text-orange-600 eb-flex-shrink-0 eb-mt-0.5" />
                                  <div className="eb-flex-1">
                                    <div className="eb-flex eb-items-center eb-gap-2 eb-mb-2">
                                      <h4 className="eb-font-medium eb-text-gray-900">
                                        {individualName || 'Unnamed Individual'}
                                      </h4>
                                      <span className="eb-inline-flex eb-items-center eb-px-2.5 eb-py-0.5 eb-rounded-full eb-text-xs eb-font-medium eb-bg-orange-100 eb-text-orange-800">
                                        {t('indirectOwnership.beneficialOwners.indirectLabel', 'Indirect')}
                                      </span>
                                    </div>
                                    <p className="eb-text-sm eb-text-gray-600">
                                      {indirectOwner.chainDescription}
                                    </p>
                                  </div>
                                </div>
                                <div className="eb-flex eb-items-center eb-gap-2">
                                  <CheckCircle2 className="eb-h-4 eb-w-4 eb-text-green-500" />
                                  <span className="eb-text-xs eb-text-gray-500">
                                    {t('indirectOwnership.beneficialOwners.verified', 'Verified')}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="eb-py-8 eb-text-center">
                <div className="eb-mb-4">
                  <Users className="eb-mx-auto eb-h-12 eb-w-12 eb-text-gray-400" />
                </div>
                <div className="eb-text-lg eb-font-medium eb-text-gray-900">
                  {t('indirectOwnership.beneficialOwners.emptyState.title', 'No Beneficial Owners Identified')}
                </div>
                <div className="eb-mt-2 eb-text-sm eb-text-gray-500">
                  {t('indirectOwnership.beneficialOwners.emptyState.description', 
                    'Add individuals to your ownership structure to identify beneficial owners.'
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Read-only mode display */}
        {clientId && readOnly && !hasOwnershipStructure && !needsOwnershipInfo && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            <div className="eb-mb-4">
              <Users className="eb-mx-auto eb-h-8 eb-w-8 eb-text-gray-400" />
            </div>
            <div className="eb-text-sm">
              {t('indirectOwnership.readOnly', 'Ownership structure is in read-only mode')}
            </div>
          </div>
        )}
        
        {/* Component placeholder (when no clientId provided) */}
        {!clientId && (
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
                  Compliance
                </Badge>
                {t('indirectOwnership.components.validationSummary', 'Individual Owner Identification')}
              </div>
              <div className="eb-mt-1 eb-text-xs eb-text-gray-500">
                {t('indirectOwnership.components.validationSummaryDesc', 'Compliance checks and beneficial owner identification')}
              </div>
            </div>
          </div>
        )}

        {/* Beneficial Ownership Information */}
        {clientId && !readOnly && (
          <Alert className="eb-border-blue-200 eb-bg-blue-50">
            <Info className="eb-h-4 eb-w-4 eb-text-blue-600" />
            <AlertDescription className="eb-text-blue-800 eb-text-sm">
              <strong>Individual Owner Identification:</strong> {t('indirectOwnership.beneficialOwnershipInfo', 
                'You must identify all natural persons in your ownership structure. This includes both direct owners (individuals who own the entity directly) and indirect owners (whose ownership flows through intermediary entities).'
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

      {/* Add Owner Dialog */}
      <Dialog open={isAddOwnerDialogOpen} onOpenChange={setIsAddOwnerDialogOpen}>
        <DialogContent className="eb-max-w-lg eb-w-full eb-mx-4">
          <DialogHeader>
            <DialogTitle>
              {t('indirectOwnership.addOwnerDialog.title', 'Add Owner')}
            </DialogTitle>
            <DialogDescription>
              {selectedParent && (
                <>
                  {t('indirectOwnership.addOwnerDialog.description', 'Add a new owner to')}{' '}
                  <strong>
                    {selectedParent.organizationDetails?.organizationName || 
                     `${selectedParent.individualDetails?.firstName || ''} ${selectedParent.individualDetails?.lastName || ''}`.trim()}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="eb-space-y-4">
            {/* Owner Type Selection */}
            {!ownerType && (
              <div className="eb-space-y-3">
                <Label>{t('indirectOwnership.addOwnerDialog.ownerType', 'What type of owner are you adding?')}</Label>
                <div className="eb-space-y-3">
                  <Button
                    variant="outline"
                    className="eb-w-full eb-h-auto eb-p-4 eb-justify-start eb-flex eb-items-start eb-text-wrap"
                    onClick={() => setOwnerType('individual')}
                    disabled={!canAddMoreOwners()}
                  >
                    <Users className="eb-mr-3 eb-h-5 eb-w-5 eb-text-green-600 eb-flex-shrink-0 eb-mt-0.5" />
                    <div className="eb-text-left eb-flex-1 eb-min-w-0 eb-max-w-full eb-overflow-hidden">
                      <div className="eb-font-medium eb-break-words eb-w-full eb-whitespace-normal">
                        {t('indirectOwnership.addOwnerDialog.individual', 'Individual Owner')}
                        {!canAddMoreOwners() && (
                          <span className="eb-ml-2 eb-text-orange-600 eb-text-xs">(Limit Reached)</span>
                        )}
                      </div>
                      <div className="eb-text-sm eb-text-gray-500 eb-break-words eb-leading-relaxed eb-mt-1 eb-w-full eb-whitespace-normal">
                        {canAddMoreOwners() 
                          ? t('indirectOwnership.addOwnerDialog.individualDesc', 'A natural person who directly owns part of this entity (beneficial owner)')
                          : 'Maximum of 4 beneficial owners reached. Each must own at least 25%.'
                        }
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="eb-w-full eb-h-auto eb-p-4 eb-justify-start eb-flex eb-items-start eb-text-wrap"
                    onClick={() => setOwnerType('entity')}
                  >
                    <Building className="eb-mr-3 eb-h-5 eb-w-5 eb-text-blue-600 eb-flex-shrink-0 eb-mt-0.5" />
                    <div className="eb-text-left eb-flex-1 eb-min-w-0 eb-max-w-full eb-overflow-hidden">
                      <div className="eb-font-medium eb-break-words eb-w-full eb-whitespace-normal">{t('indirectOwnership.addOwnerDialog.entity', 'Intermediary Entity')}</div>
                      <div className="eb-text-sm eb-text-gray-500 eb-break-words eb-leading-relaxed eb-mt-1 eb-w-full eb-whitespace-normal">
                        {t('indirectOwnership.addOwnerDialog.entityDesc', 'A company or organization that sits between this entity and ultimate beneficial owners')}
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Individual Form */}
            {ownerType === 'individual' && (
              <div className="eb-space-y-4">
                <div className="eb-flex eb-items-center eb-justify-between">
                  <Label className="eb-text-base eb-font-medium">
                    {t('indirectOwnership.addOwnerDialog.individualDetails', 'Individual Details')}
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => setOwnerType(null)}>
                    {t('common.back', 'Back')}
                  </Button>
                </div>
                
                <div className="eb-grid eb-gap-4">
                  <div>
                    <Label htmlFor="firstName">{t('indirectOwnership.addOwnerDialog.firstName', 'First Name')} *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder={t('indirectOwnership.addOwnerDialog.firstNamePlaceholder', 'Enter first name')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">{t('indirectOwnership.addOwnerDialog.lastName', 'Last Name')} *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder={t('indirectOwnership.addOwnerDialog.lastNamePlaceholder', 'Enter last name')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="middleName">{t('indirectOwnership.addOwnerDialog.middleName', 'Middle Name')}</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                      placeholder={t('indirectOwnership.addOwnerDialog.middleNamePlaceholder', 'Enter middle name (optional)')}
                    />
                  </div>
                  

                </div>
              </div>
            )}

            {/* Entity Form */}
            {ownerType === 'entity' && (
              <div className="eb-space-y-4">
                <div className="eb-flex eb-items-center eb-justify-between">
                  <Label className="eb-text-base eb-font-medium">
                    {t('indirectOwnership.addOwnerDialog.entityDetails', 'Entity Details')}
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => setOwnerType(null)}>
                    {t('common.back', 'Back')}
                  </Button>
                </div>
                
                <div className="eb-grid eb-gap-4">
                  <div>
                    <Label htmlFor="organizationName">{t('indirectOwnership.addOwnerDialog.organizationName', 'Organization Name')} *</Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder={t('indirectOwnership.addOwnerDialog.organizationNamePlaceholder', 'Enter organization name')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="organizationType">{t('indirectOwnership.addOwnerDialog.organizationType', 'Organization Type')} *</Label>
                    <Select
                      value={formData.organizationType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, organizationType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('indirectOwnership.addOwnerDialog.organizationTypePlaceholder', 'Select organization type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LIMITED_LIABILITY_COMPANY">LLC</SelectItem>
                        <SelectItem value="C_CORPORATION">C Corporation</SelectItem>
                        <SelectItem value="S_CORPORATION">S Corporation</SelectItem>
                        <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                        <SelectItem value="LIMITED_PARTNERSHIP">Limited Partnership</SelectItem>
                        <SelectItem value="LIMITED_LIABILITY_PARTNERSHIP">Limited Liability Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="countryOfFormation">{t('indirectOwnership.addOwnerDialog.countryOfFormation', 'Country of Formation')} *</Label>
                    <Select
                      value={formData.countryOfFormation}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, countryOfFormation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  

                </div>
              </div>
            )}
          </div>

          {ownerType && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOwnerDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button 
                onClick={handleSubmitOwner}
                disabled={
                  (ownerType === 'individual' && (!formData.firstName || !formData.lastName)) ||
                  (ownerType === 'entity' && (!formData.organizationName || !formData.organizationType))
                }
              >
                {t('indirectOwnership.addOwnerDialog.addOwner', 'Add Owner')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
