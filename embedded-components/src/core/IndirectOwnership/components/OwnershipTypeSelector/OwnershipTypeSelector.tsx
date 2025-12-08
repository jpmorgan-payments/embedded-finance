'use client';

import React from 'react';
import { ArrowLeft, Building, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

import type { OwnershipTypeSelectorProps } from './types';

/**
 * OwnershipTypeSelector - Classifies each beneficial owner as direct or indirect
 */
export const OwnershipTypeSelector: React.FC<OwnershipTypeSelectorProps> = ({
  owner,
  selectedType,
  onTypeSelect,
  onBack,
  onContinue,
  kycCompanyName = 'your company',
  isLastOwner = false,
  currentOwnerIndex,
  totalOwners,
}) => {
  const { t } = useTranslation();

  const handleContinue = () => {
    if (!selectedType) return;
    onContinue();
  };

  return (
    <div className="eb-space-y-6">
      <Card>
        <CardHeader>
          <div className="eb-flex eb-items-center eb-justify-between">
            <CardTitle className="eb-flex eb-items-center eb-gap-2">
              <User className="eb-h-5 eb-w-5" />
              Ownership Classification
            </CardTitle>
            <Badge variant="secondary">
              {currentOwnerIndex + 1} of {totalOwners}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="eb-space-y-6">
          {/* Owner info */}
          <div className="eb-p-4 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded-lg">
            <h3 className="eb-text-lg eb-font-medium eb-text-blue-900">
              How does <span className="eb-font-semibold">{owner.firstName} {owner.lastName}</span> own 25%+ of {kycCompanyName}?
            </h3>
          </div>

          {/* Ownership type selection */}
          <RadioGroup value={selectedType} onValueChange={(value) => onTypeSelect(value as 'DIRECT' | 'INDIRECT')}>
            <div className="eb-space-y-4">
              {/* Direct ownership option */}
              <div className="eb-flex eb-items-start eb-space-x-3 eb-p-4 eb-border eb-rounded-lg eb-cursor-pointer hover:eb-bg-gray-50">
                <RadioGroupItem value="DIRECT" id="direct" className="eb-mt-1" />
                <div className="eb-flex-1">
                  <Label htmlFor="direct" className="eb-text-base eb-font-medium eb-cursor-pointer">
                    <div className="eb-flex eb-items-center eb-gap-2">
                      <User className="eb-h-4 eb-w-4" />
                      Direct Owner
                    </div>
                  </Label>
                  <p className="eb-text-sm eb-text-gray-600 eb-mt-1">
                    Owns 25%+ shares directly in {kycCompanyName}
                  </p>
                </div>
              </div>

              {/* Indirect ownership option */}
              <div className="eb-flex eb-items-start eb-space-x-3 eb-p-4 eb-border eb-rounded-lg eb-cursor-pointer hover:eb-bg-gray-50">
                <RadioGroupItem value="INDIRECT" id="indirect" className="eb-mt-1" />
                <div className="eb-flex-1">
                  <Label htmlFor="indirect" className="eb-text-base eb-font-medium eb-cursor-pointer">
                    <div className="eb-flex eb-items-center eb-gap-2">
                      <Building className="eb-h-4 eb-w-4" />
                      Indirect Owner
                    </div>
                  </Label>
                  <p className="eb-text-sm eb-text-gray-600 eb-mt-1">
                    Owns 25%+ through other companies (we'll build the ownership chain next)
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>

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
              disabled={!selectedType}
              className="eb-min-w-32"
            >
              {isLastOwner ? 'Review Structure' : 'Continue'}
            </Button>
          </div>

          {/* Progress indicator */}
          {totalOwners > 1 && (
            <div className="eb-mt-6">
              <div className="eb-flex eb-justify-between eb-text-sm eb-text-gray-600 eb-mb-2">
                <span>Classification Progress</span>
                <span>{currentOwnerIndex + 1} / {totalOwners}</span>
              </div>
              <div className="eb-w-full eb-bg-gray-200 eb-rounded-full eb-h-2">
                <div 
                  className="eb-bg-blue-600 eb-h-2 eb-rounded-full eb-transition-all" 
                  style={{ width: `${((currentOwnerIndex + 1) / totalOwners) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
