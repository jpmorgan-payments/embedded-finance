'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { AddOwnerDialogProps, OwnerFormData, OwnerFormErrors } from './types';
import { VALIDATION_MESSAGES } from '../../IndirectOwnership.internal.types';

/**
 * AddOwnerDialog - Dialog for adding/editing beneficial owners
 * 
 * Features:
 * - Simple form with firstName, lastName, ownershipType
 * - Real-time validation for required fields and duplicates
 * - Direct owners: Added immediately with COMPLETE status
 * - Indirect owners: Added with PENDING_HIERARCHY status
 */
export const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingOwners,
  initialData,
  editingOwnerId,
  testId = 'add-owner-dialog',
}) => {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState<OwnerFormData>({
    firstName: '',
    lastName: '',
    ownershipType: 'DIRECT',
  });

  // Validation state
  const [errors, setErrors] = useState<OwnerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when dialog opens or editing
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          ownershipType: initialData.ownershipType || 'DIRECT',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          ownershipType: 'DIRECT',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Validate form data
  const validateForm = useCallback((data: OwnerFormData): OwnerFormErrors => {
    const newErrors: OwnerFormErrors = {};

    // Required field validation
    if (!data.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!data.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Duplicate name validation (exclude current owner if editing)
    if (data.firstName.trim() && data.lastName.trim()) {
      const isDuplicate = existingOwners.some(owner => 
        owner.id !== editingOwnerId &&
        owner.firstName.toLowerCase() === data.firstName.trim().toLowerCase() &&
        owner.lastName.toLowerCase() === data.lastName.trim().toLowerCase()
      );

      if (isDuplicate) {
        newErrors.general = VALIDATION_MESSAGES.duplicateName;
      }
    }

    return newErrors;
  }, [existingOwners, editingOwnerId]);

  // Handle form field changes
  const handleFieldChange = (field: keyof OwnerFormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Real-time validation
    const newErrors = validateForm(newFormData);
    setErrors(newErrors);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ownershipType: formData.ownershipType,
        status: formData.ownershipType === 'DIRECT' ? 'COMPLETE' : 'PENDING_HIERARCHY',
        meets25PercentThreshold: true, // Always true for beneficial owners
        validationErrors: [],
      });
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to add owner' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && 
                     formData.firstName.trim() && 
                     formData.lastName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-max-w-md" data-testid={testId}>
        <DialogHeader>
          <DialogTitle>
            {editingOwnerId ? 'Edit Beneficial Owner' : 'Add Beneficial Owner'}
          </DialogTitle>
          <DialogDescription>
            Add someone who owns 25% or more of your business.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="eb-space-y-4">
          {/* General Error */}
          {errors.general && (
            <Alert className="eb-border-red-200 eb-bg-red-50">
              <AlertDescription className="eb-text-red-700">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          <div className="eb-space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              placeholder="John"
              className={errors.firstName ? 'eb-border-red-300' : ''}
            />
            {errors.firstName && (
              <p className="eb-text-sm eb-text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="eb-space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              placeholder="Smith"
              className={errors.lastName ? 'eb-border-red-300' : ''}
            />
            {errors.lastName && (
              <p className="eb-text-sm eb-text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Ownership Type */}
          <div className="eb-space-y-3">
            <Label>Ownership Type *</Label>
            <RadioGroup
              value={formData.ownershipType}
              onValueChange={(value: 'DIRECT' | 'INDIRECT') => 
                handleFieldChange('ownershipType', value)
              }
              className="eb-space-y-3"
            >
              {/* Direct Owner */}
              <div className="eb-flex eb-items-start eb-space-x-3 eb-p-3 eb-border eb-rounded-lg eb-bg-blue-50 eb-border-blue-200">
                <RadioGroupItem value="DIRECT" id="direct" className="eb-mt-1" />
                <div className="eb-flex-1">
                  <Label htmlFor="direct" className="eb-flex eb-items-center eb-gap-2 eb-font-medium eb-text-blue-900">
                    <User className="eb-h-4 eb-w-4" />
                    Direct Owner
                  </Label>
                  <p className="eb-text-sm eb-text-blue-700 eb-mt-1">
                    Has 25% or more ownership directly in your business
                  </p>
                </div>
              </div>

              {/* Indirect Owner */}
              <div className="eb-flex eb-items-start eb-space-x-3 eb-p-3 eb-border eb-rounded-lg eb-bg-orange-50 eb-border-orange-200">
                <RadioGroupItem value="INDIRECT" id="indirect" className="eb-mt-1" />
                <div className="eb-flex-1">
                  <Label htmlFor="indirect" className="eb-flex eb-items-center eb-gap-2 eb-font-medium eb-text-orange-900">
                    <Building className="eb-h-4 eb-w-4" />
                    Indirect Owner
                  </Label>
                  <p className="eb-text-sm eb-text-orange-700 eb-mt-1">
                    Has 25% or more ownership through other companies
                  </p>
                </div>
              </div>
            </RadioGroup>
            {errors.ownershipType && (
              <p className="eb-text-sm eb-text-red-600">{errors.ownershipType}</p>
            )}
          </div>

          {/* Information about next steps */}
          {formData.ownershipType === 'INDIRECT' && (
            <Alert className="eb-border-orange-200 eb-bg-orange-50">
              <Building className="eb-h-4 eb-w-4 eb-text-orange-600" />
              <AlertDescription className="eb-text-orange-700">
                After adding this owner, you'll need to build their ownership hierarchy 
                to show how they own 25% or more of your business.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="eb-flex eb-gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : editingOwnerId ? 'Update Owner' : 'Add Owner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
