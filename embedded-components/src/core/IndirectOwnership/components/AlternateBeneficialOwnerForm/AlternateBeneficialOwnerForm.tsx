'use client';

import React from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  
  // Dialog state
  const [isAddOwnerDialogOpen, setIsAddOwnerDialogOpen] = React.useState(false);
  
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
    setIsAddOwnerDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setNewOwner({ firstName: '', lastName: '' });
    setErrors([]);
    setIsAddOwnerDialogOpen(false);
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
          <p className="eb-text-sm eb-text-gray-600 eb-mt-2">
            A beneficial owner is an individual who owns 25% or more of your business, either directly or through other companies.
          </p>
        </CardHeader>
        <CardContent className="eb-space-y-6">

          {/* Add owner button */}
          {!readOnly && (
            <div className="eb-flex eb-justify-between eb-items-center">
              <Button 
                onClick={() => setIsAddOwnerDialogOpen(true)}
                className="eb-flex eb-items-center eb-gap-2"
              >
                <Plus className="eb-h-4 eb-w-4" />
                Add Beneficial Owner
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
              <div className="eb-p-6 eb-border eb-rounded eb-bg-gray-50 eb-text-center">
                <User className="eb-h-12 eb-w-12 eb-mx-auto eb-text-gray-400 eb-mb-3" />
                <p className="eb-text-gray-600 eb-mb-2">No beneficial owners added yet</p>
                <p className="eb-text-sm eb-text-gray-500">
                  Click "Add Beneficial Owner" to get started
                </p>
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

      {/* Add Owner Dialog */}
      <Dialog open={isAddOwnerDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="eb-max-w-md eb-p-6">
          <DialogHeader className="eb-pb-4">
            <DialogTitle className="eb-text-lg eb-font-semibold">Add Beneficial Owner</DialogTitle>
          </DialogHeader>
          
          <div className="eb-space-y-6">
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
            
            <div className="eb-space-y-5">
              <div className="eb-space-y-2">
                <Label htmlFor="dialogFirstName" className="eb-text-sm eb-font-medium">First Name</Label>
                <Input
                  id="dialogFirstName"
                  value={newOwner.firstName}
                  onChange={(e) => setNewOwner(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="eb-h-10"
                />
              </div>
              
              <div className="eb-space-y-2">
                <Label htmlFor="dialogLastName" className="eb-text-sm eb-font-medium">Last Name</Label>
                <Input
                  id="dialogLastName"
                  value={newOwner.lastName}
                  onChange={(e) => setNewOwner(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Smith"
                  className="eb-h-10"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="eb-pt-6 eb-space-x-2">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddOwner}>
              Add Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
