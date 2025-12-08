'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { VALIDATION_MESSAGES } from '../../IndirectOwnership.internal.types';
import {
  addOwnerFormSchema,
  type AddOwnerFormData,
} from './AddOwnerDialog.schema';
import type { AddOwnerDialogProps } from './types';

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

  // Simple error state management (established pattern)
  const [submissionError, setSubmissionError] = React.useState<Error | null>(
    null
  );
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  // React Hook Form setup with Zod validation
  const {
    register,
    clearErrors,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    setError,
  } = useForm<AddOwnerFormData>({
    resolver: zodResolver(addOwnerFormSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      ownershipType: 'DIRECT',
    },
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

    const isDuplicate = existingOwners.some(
      (owner) =>
        owner.id !== editingOwnerId &&
        owner.individualDetails &&
        owner.individualDetails.firstName?.toLowerCase() ===
          data.firstName.trim().toLowerCase() &&
        owner.individualDetails.lastName?.toLowerCase() ===
          data.lastName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError('root.general', {
        type: 'duplicate',
        message: VALIDATION_MESSAGES.duplicateName,
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

    // Clear previous submission errors
    clearErrors('root.submission');
    setSubmissionError(null);

    try {
      setIsSubmittingForm(true);

      onSubmit({
        ownershipType: data.ownershipType,
        status:
          data.ownershipType === 'DIRECT' ? 'COMPLETE' : 'PENDING_HIERARCHY',
        meets25PercentThreshold: true, // Always true for beneficial owners
        validationErrors: [],
        individualDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      } as any); // Type assertion needed due to interface differences

      // Success - close dialog and reset form
      reset();
      onClose();
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Failed to add owner');
      setSubmissionError(err);
      setError('root.general', {
        type: 'submission',
        message: err.message,
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmittingForm) {
      reset();
      setSubmissionError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="eb-max-w-md"
        data-testid={testId}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">
            {editingOwnerId ? 'Edit Beneficial Owner' : 'Add Beneficial Owner'}
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Add someone who owns 25% or more of your business.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="eb-space-y-4"
          noValidate
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Server Error Alert */}
          {submissionError && (
            <ServerErrorAlert
              error={submissionError as any}
              customTitle="Failed to Add Owner"
              showDetails={false}
              tryAgainAction={() => {
                // Simple retry - resubmit the form
                const formData = getValues();
                onFormSubmit(formData);
              }}
            />
          )}

          {/* Validation Errors */}
          {errors.root?.general && (
            <Alert
              className="eb-border-red-200 eb-bg-red-50"
              role="alert"
              aria-live="polite"
            >
              <AlertDescription className="eb-text-red-700">
                {errors.root.general.message}
              </AlertDescription>
            </Alert>
          )}

          {errors.root?.submission && (
            <Alert
              className="eb-border-red-200 eb-bg-red-50"
              role="alert"
              aria-live="polite"
            >
              <AlertDescription className="eb-text-red-700">
                {errors.root.submission.message}
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
              aria-required="true"
              aria-invalid={errors.firstName ? 'true' : 'false'}
              aria-describedby={
                errors.firstName ? 'firstName-error' : undefined
              }
            />
            {errors.firstName && (
              <p
                id="firstName-error"
                className="eb-text-sm eb-text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.firstName.message}
              </p>
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
              aria-required="true"
              aria-invalid={errors.lastName ? 'true' : 'false'}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p
                id="lastName-error"
                className="eb-text-sm eb-text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Ownership Type */}
          <fieldset className="eb-space-y-3">
            <legend className="eb-text-sm eb-font-medium">
              Ownership Type *
            </legend>
            <RadioGroup
              value={watchedValues.ownershipType}
              onValueChange={(value: 'DIRECT' | 'INDIRECT') =>
                setValue('ownershipType', value)
              }
              className="eb-space-y-3"
              aria-required="true"
              aria-invalid={errors.ownershipType ? 'true' : 'false'}
              aria-describedby={
                errors.ownershipType
                  ? 'ownershipType-error'
                  : 'ownership-type-help'
              }
            >
              {/* Direct Owner */}
              <div className="eb-flex eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-border-blue-200 eb-bg-blue-50 eb-p-3">
                <RadioGroupItem
                  value="DIRECT"
                  id="direct"
                  className="eb-mt-1"
                  aria-describedby="direct-description"
                />
                <div className="eb-flex-1">
                  <Label
                    htmlFor="direct"
                    className="eb-flex eb-items-center eb-gap-2 eb-font-medium eb-text-blue-900"
                  >
                    <User className="eb-h-4 eb-w-4" aria-hidden="true" />
                    Direct Owner
                  </Label>
                  <p
                    id="direct-description"
                    className="eb-mt-1 eb-text-sm eb-text-blue-700"
                  >
                    Has 25% or more ownership directly in your business
                  </p>
                </div>
              </div>

              {/* Indirect Owner */}
              <div className="eb-flex eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-border-orange-200 eb-bg-orange-50 eb-p-3">
                <RadioGroupItem
                  value="INDIRECT"
                  id="indirect"
                  className="eb-mt-1"
                  aria-describedby="indirect-description"
                />
                <div className="eb-flex-1">
                  <Label
                    htmlFor="indirect"
                    className="eb-flex eb-items-center eb-gap-2 eb-font-medium eb-text-orange-900"
                  >
                    <Building className="eb-h-4 eb-w-4" aria-hidden="true" />
                    Indirect Owner
                  </Label>
                  <p
                    id="indirect-description"
                    className="eb-mt-1 eb-text-sm eb-text-orange-700"
                  >
                    Has 25% or more ownership through other companies
                  </p>
                </div>
              </div>
            </RadioGroup>
            {errors.ownershipType && (
              <p
                id="ownershipType-error"
                className="eb-text-sm eb-text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.ownershipType.message}
              </p>
            )}
            <div id="ownership-type-help" className="eb-sr-only">
              Choose how this person owns 25% or more of your business: directly
              through shares or indirectly through other companies.
            </div>
          </fieldset>

          {/* Information about next steps */}
          {watchedValues.ownershipType === 'INDIRECT' && (
            <Alert className="eb-border-orange-200 eb-bg-orange-50">
              <Building className="eb-h-4 eb-w-4 eb-text-orange-600" />
              <AlertDescription className="eb-text-orange-700">
                After adding this owner, you'll need to build their ownership
                hierarchy to show how they own 25% or more of your business.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="eb-flex eb-gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmittingForm}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingForm}>
              {isSubmittingForm
                ? 'Adding...'
                : editingOwnerId
                  ? 'Update Owner'
                  : 'Add Owner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
