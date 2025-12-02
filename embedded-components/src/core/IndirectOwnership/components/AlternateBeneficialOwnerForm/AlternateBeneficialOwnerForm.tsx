'use client';

import React from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { AlternateBeneficialOwnerFormProps } from './types';

/**
 * AlternateBeneficialOwnerForm - Collects beneficial owners first in the alternate flow
 */
export const AlternateBeneficialOwnerForm: React.FC<AlternateBeneficialOwnerFormProps> = ({
  owners,
  onOwnersChange,
  onNext,
  readOnly = false,
  kycCompanyName = 'your company',
}) => {
  const { t } = useTranslation();
  
  // Form state for new owner
  const [newOwner, setNewOwner] = React.useState({
    firstName: '',
    lastName: '',
  });

  const [errors, setErrors] = React.useState<string[]>([]);

  const handleAddOwner = () => {
    const newErrors: string[] = [];
    
    if (!newOwner.firstName.trim()) {
      newErrors.push('First name is required');
    }
    if (!newOwner.lastName.trim()) {
      newErrors.push('Last name is required');
    }

    // Check for duplicate names
    const isDuplicate = owners.some(
      owner => 
        owner.firstName.toLowerCase() === newOwner.firstName.toLowerCase() &&
        owner.lastName.toLowerCase() === newOwner.lastName.toLowerCase()
    );
    
    if (isDuplicate) {
      newErrors.push('This person is already added');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const owner = {
      id: `owner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName: newOwner.firstName.trim(),
      lastName: newOwner.lastName.trim(),
    };

    onOwnersChange([...owners, owner]);
    setNewOwner({ firstName: '', lastName: '' });
    setErrors([]);
  };

  const handleRemoveOwner = (ownerId: string) => {
    onOwnersChange(owners.filter(owner => owner.id !== ownerId));
  };

  const handleNext = () => {
    if (owners.length === 0) {
      setErrors(['Please add at least one beneficial owner']);
      return;
    }
    onNext();
  };

  return (
    <div className="eb-space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="eb-flex eb-items-center eb-gap-2">
            <User className="eb-h-5 eb-w-5" />
            Who are the beneficial owners?
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-6">
          <Alert>
            <AlertDescription>
              A beneficial owner is any individual who owns 25% or more of {kycCompanyName}, 
              either directly or through other companies.
            </AlertDescription>
          </Alert>

          {/* Add new owner form */}
          {!readOnly && (
            <div className="eb-space-y-4 eb-p-4 eb-border eb-rounded-lg eb-bg-gray-50">
              <h3 className="eb-text-sm eb-font-medium eb-text-foreground">Add Individual Owner</h3>
              
              {/* First Name and Last Name on same line - following MakePayment pattern */}
              <div className="eb-flex eb-gap-4">
                <div className="">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newOwner.firstName}
                    onChange={(e) => setNewOwner(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="eb-h-10"
                  />
                </div>
                
                <div className="">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newOwner.lastName}
                    onChange={(e) => setNewOwner(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                    className="eb-h-10"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddOwner}
                className="eb-w-full"
                variant="outline"
              >
                <Plus className="eb-h-4 eb-w-4 eb-mr-2" />
                Add Owner
              </Button>
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

          {/* Current owners list */}
          <div className="eb-space-y-3">
            <h3 className="eb-text-lg eb-font-medium">Current Owners ({owners.length})</h3>
            
            {owners.length === 0 ? (
              <div className="eb-text-center eb-text-gray-500 eb-py-8">
                No beneficial owners added yet
              </div>
            ) : (
              <div className="eb-space-y-2">
                {owners.map((owner) => (
                  <div 
                    key={owner.id} 
                    className="eb-flex eb-items-center eb-justify-between eb-p-3 eb-border eb-rounded-lg eb-bg-white"
                  >
                    <div className="eb-flex eb-items-center eb-gap-3">
                      <User className="eb-h-4 eb-w-4 eb-text-gray-500" />
                      <div>
                        <div className="eb-font-medium">
                          {owner.firstName} {owner.lastName}
                        </div>
                      </div>
                    </div>
                    
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveOwner(owner.id)}
                        className="eb-text-red-600 hover:eb-text-red-700 hover:eb-bg-red-50"
                      >
                        <Trash2 className="eb-h-4 eb-w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="eb-flex eb-justify-end">
            <Button 
              onClick={handleNext}
              disabled={owners.length === 0}
              className="eb-min-w-32"
            >
              Next Step
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
