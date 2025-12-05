'use client';

import React from 'react';
import { ArrowLeft, Building, CheckCircle, Plus, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { HierarchyBuilderProps } from './types';

/**
 * HierarchyBuilder - Builds ownership hierarchy for indirect owners
 */
export const HierarchyBuilder: React.FC<HierarchyBuilderProps> = ({
  owner,
  hierarchyChain,
  onHierarchyChange,
  onBack,
  onContinue,
  kycCompanyName = 'your company',
  maxLevels = 10,
}) => {
  const { t } = useTranslation();

  const [currentCompanyName, setCurrentCompanyName] = React.useState('');
  const [isKycCompany, setIsKycCompany] = React.useState<'yes' | 'no' | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  const hasKycCompany = hierarchyChain.some(company => company.isKycCompany);
  const canAddMore = hierarchyChain.length < maxLevels && !hasKycCompany;

  const handleAddCompany = () => {
    const newErrors: string[] = [];

    if (!currentCompanyName.trim()) {
      newErrors.push('Company name is required');
    }

    if (isKycCompany === null) {
      newErrors.push('Please specify whether this is the business being onboarded or an intermediary owner');
    }

    // Check for duplicate company names
    const isDuplicate = hierarchyChain.some(
      company => company.companyName.toLowerCase() === currentCompanyName.toLowerCase()
    );
    
    if (isDuplicate) {
      newErrors.push('This company is already in the chain');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const newCompany = {
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyName: currentCompanyName.trim(),
      isKycCompany: isKycCompany === 'yes',
      level: hierarchyChain.length + 1,
    };

    onHierarchyChange([...hierarchyChain, newCompany]);
    setCurrentCompanyName('');
    setIsKycCompany(null);
    setErrors([]);
  };

  const handleRemoveCompany = (companyId: string) => {
    const updatedChain = hierarchyChain
      .filter(company => company.id !== companyId)
      .map((company, index) => ({ ...company, level: index + 1 }));
    onHierarchyChange(updatedChain);
  };

  const handleContinue = () => {
    if (!hasKycCompany) {
      setErrors(['Please identify which company directly owns the business being onboarded']);
      return;
    }
    onContinue();
  };

  const getCurrentOwnershipDescription = () => {
    if (hierarchyChain.length === 0) {
      return `${owner.firstName} ${owner.lastName} directly owns:`;
    }
    
    const lastCompany = hierarchyChain[hierarchyChain.length - 1];
    return `${lastCompany.companyName} owns:`;
  };

  return (
    <div className="eb-space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="eb-flex eb-items-center eb-gap-2">
            <Building className="eb-h-5 eb-w-5" />
            Build ownership chain for {owner.firstName} {owner.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-6">
          {/* Context info */}
          <Alert>
            <AlertDescription>
              Build the ownership chain from <strong>{owner.firstName} {owner.lastName}</strong> to{' '}
              <strong>{kycCompanyName}</strong>. An ownership chain shows the path of companies between an individual and the final company being onboarded, where the individual ultimately owns 25% or more of {kycCompanyName}.
            </AlertDescription>
          </Alert>

          {/* Current hierarchy display */}
          {hierarchyChain.length > 0 && (
            <div className="eb-space-y-3">
              <h3 className="eb-font-medium">Current Ownership Chain:</h3>
              <div className="eb-flex eb-items-center eb-gap-2 eb-p-3 eb-bg-gray-50 eb-border eb-rounded eb-flex-wrap">
                {/* Owner at the start */}
                <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-1.5 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded eb-text-sm eb-shrink-0">
                  <User className="eb-h-3 eb-w-3 eb-text-blue-600" />
                  <span className="eb-font-medium eb-text-blue-900">{owner.firstName} {owner.lastName}</span>
                </div>
                
                <span className="eb-text-gray-400 eb-text-sm eb-shrink-0">→</span>

                {/* Company chain */}
                {hierarchyChain.map((company, index) => (
                  <React.Fragment key={company.id}>
                    <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-1.5 eb-bg-white eb-border eb-rounded eb-text-sm eb-shrink-0">
                      <Building className="eb-h-3 eb-w-3 eb-text-gray-600" />
                      <span className="eb-font-medium">{company.companyName}</span>
                      <span className="eb-text-xs eb-px-1.5 eb-py-0.5 eb-bg-green-100 eb-text-green-700 eb-rounded">
                        Intermediary
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCompany(company.id)}
                        className="eb-h-4 eb-w-4 eb-p-0 eb-text-red-500 hover:eb-text-red-700 hover:eb-bg-red-50"
                      >
                        <X className="eb-h-3 eb-w-3" />
                      </Button>
                    </div>
                    <span className="eb-text-gray-400 eb-text-sm eb-shrink-0">→</span>
                  </React.Fragment>
                ))}
                
                {/* Always show the business being onboarded at the end */}
                {hasKycCompany && (
                  <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-1.5 eb-bg-green-50 eb-border eb-border-green-200 eb-rounded eb-text-sm eb-shrink-0">
                    <Building className="eb-h-3 eb-w-3 eb-text-green-600" />
                    <span className="eb-font-medium eb-text-green-900">{kycCompanyName}</span>
                    <span className="eb-text-xs eb-px-1.5 eb-py-0.5 eb-bg-green-200 eb-text-green-800 eb-rounded">
                      Business
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add new company form */}
          {canAddMore && (
            <div className="eb-space-y-4 eb-p-4 eb-border eb-rounded-lg eb-bg-gray-50">
              <h3 className="eb-font-medium">{getCurrentOwnershipDescription()}</h3>
              
              <div className="eb-space-y-4">
                <div className="eb-space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={currentCompanyName}
                    onChange={(e) => setCurrentCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="eb-space-y-3">
                  <Label>Does this company own {kycCompanyName} directly?</Label>
                  <RadioGroup value={isKycCompany || ''} onValueChange={(value) => setIsKycCompany(value as 'yes' | 'no')}>
                    <div className="eb-flex eb-items-center eb-space-x-2">
                      <RadioGroupItem value="yes" id="kyc-yes" />
                      <Label htmlFor="kyc-yes">
                        Yes, this company owns {kycCompanyName} directly
                      </Label>
                    </div>
                    <div className="eb-flex eb-items-center eb-space-x-2">
                      <RadioGroupItem value="no" id="kyc-no" />
                      <Label htmlFor="kyc-no">
                        No, this is an intermediary owner in the ownership chain
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleAddCompany}
                  className="eb-w-full"
                  variant="outline"
                >
                  <Plus className="eb-h-4 eb-w-4 eb-mr-2" />
                  Add Company
                </Button>
              </div>
            </div>
          )}

          {/* Error messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="eb-list-disc eb-list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Max levels reached message */}
          {hierarchyChain.length >= maxLevels && !hasKycCompany && (
            <Alert>
              <AlertDescription>
                Maximum ownership levels reached ({maxLevels}). If you need to add more levels, 
                please contact support.
              </AlertDescription>
            </Alert>
          )}

          {/* Chain completed message */}
          {hasKycCompany && (
            <Alert>
              <AlertDescription>
                ✅ Ownership chain complete! You have successfully mapped the path from {owner.firstName} {owner.lastName} to {kycCompanyName}.
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="eb-flex eb-justify-between eb-items-center eb-pt-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="eb-flex eb-items-center eb-gap-2"
            >
              <ArrowLeft className="eb-h-4 eb-w-4" />
              Back
            </Button>

            <Button 
              onClick={handleContinue}
              disabled={!hasKycCompany}
              className="eb-min-w-32"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
