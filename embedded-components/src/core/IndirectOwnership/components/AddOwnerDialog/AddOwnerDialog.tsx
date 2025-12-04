'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

import type { AddOwnerDialogProps } from './types';
import { VALIDATION_MESSAGES } from '../../IndirectOwnership.internal.types';
import { useAddOwnerFormSchema, type AddOwnerFormData } from './AddOwnerDialog.schema';

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
  const schema = useAddOwnerFormSchema();

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    setError
  } = useForm<AddOwnerFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      ownershipType: 'DIRECT',
    }
  });

  const watchedValues = watch();

  // Initialize form data when dialog opens or editing
  useEffect(() => {
    if (isOpen) {
      if (initialData?.individualDetails) {
        reset({
          firstName: initialData.individualDetails.firstName || '',
          lastName: initialData.individualDetails.lastName || '',
          ownershipType: initialData.ownershipType || 'DIRECT',
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          ownershipType: 'DIRECT',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  // Custom duplicate validation
  const checkForDuplicates = (data: AddOwnerFormData) => {
    if (!data.firstName.trim() || !data.lastName.trim()) return;

    const isDuplicate = existingOwners.some(owner => 
      owner.id !== editingOwnerId &&
      owner.individualDetails &&
      owner.individualDetails.firstName?.toLowerCase() === data.firstName.trim().toLowerCase() &&
      owner.individualDetails.lastName?.toLowerCase() === data.lastName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError('root.general', {
        type: 'duplicate',
        message: VALIDATION_MESSAGES.duplicateName
      });
      return false;
    }
    return true;
  };

  // Form submission handler
  const onFormSubmit = async (data: AddOwnerFormData) => {
    // Check for duplicates before submission
    if (!checkForDuplicates(data)) {
      return;
    }

    try {
      await onSubmit({
        ownershipType: data.ownershipType,
        status: data.ownershipType === 'DIRECT' ? 'COMPLETE' : 'PENDING_HIERARCHY',
        meets25PercentThreshold: true, // Always true for beneficial owners
        validationErrors: [],
        individualDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      } as any); // Type assertion needed due to interface differences
    } catch (error) {
      setError('root.general', {
        type: 'submission',
        message: error instanceof Error ? error.message : 'Failed to add owner'
      });
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

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

        <form onSubmit={handleSubmit(onFormSubmit)} className="eb-space-y-4">
          {/* General Error */}
          {errors.root?.general && (
            <Alert className="eb-border-red-200 eb-bg-red-50">
              <AlertDescription className="eb-text-red-700">
                {errors.root.general.message}
              </AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          <div className="eb-space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="John"
              className={errors.firstName ? 'eb-border-red-300' : ''}
            />
            {errors.firstName && (
              <p className="eb-text-sm eb-text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="eb-space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Smith"
              className={errors.lastName ? 'eb-border-red-300' : ''}
            />
            {errors.lastName && (
              <p className="eb-text-sm eb-text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          {/* Ownership Type */}
          <div className="eb-space-y-3">
            <Label>Ownership Type *</Label>
            <RadioGroup
              value={watchedValues.ownershipType}
              onValueChange={(value: 'DIRECT' | 'INDIRECT') => 
                setValue('ownershipType', value)
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
              <p className="eb-text-sm eb-text-red-600">{errors.ownershipType.message}</p>
            )}
          </div>

          {/* Information about next steps */}
          {watchedValues.ownershipType === 'INDIRECT' && (
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : editingOwnerId ? 'Update Owner' : 'Add Owner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
