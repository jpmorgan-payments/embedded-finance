import React from 'react';
import { MapPin } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { AddressSectionProps } from './RecipientForm.types';

export interface AddressSectionPropsExtended extends AddressSectionProps {
  requiredFields?: string[];
  paymentMethodsRequiringAddress?: string[];
}

export const AddressSection: React.FC<AddressSectionPropsExtended> = ({
  register,
  errors,
  requiredFields = [],
  paymentMethodsRequiringAddress = [],
}) => {
  const isAddressRequired = requiredFields.length > 0;
  const isFieldRequired = (fieldName: string) =>
    requiredFields.includes(fieldName);

  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-gap-2">
        <MapPin className="eb-h-4 eb-w-4" />
        <Label className="eb-text-base eb-font-medium">Address</Label>
        {isAddressRequired && (
          <span className="eb-text-xs eb-font-medium eb-text-blue-600">
            (Required for {paymentMethodsRequiringAddress.join(', ')})
          </span>
        )}
      </div>

      <div className="eb-space-y-4">
        {/* Address Line 1 */}
        <div className="eb-space-y-2">
          <Label htmlFor="addressLine1">
            Address Line 1{isFieldRequired('addressLine1') && ' *'}
          </Label>
          <Input
            id="addressLine1"
            {...register('addressLine1', {
              required: isFieldRequired('addressLine1')
                ? `Address Line 1 is required for ${paymentMethodsRequiringAddress.join(', ')} transfers`
                : false,
            })}
            placeholder="Enter address line 1"
            className={errors.addressLine1 ? 'eb-border-red-500' : ''}
          />
          {errors.addressLine1 && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.addressLine1.message}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="eb-space-y-2">
          <Label htmlFor="addressLine2">
            Address Line 2{isFieldRequired('addressLine2') && ' *'}
          </Label>
          <Input
            id="addressLine2"
            {...register('addressLine2', {
              required: isFieldRequired('addressLine2')
                ? `Address Line 2 is required for ${paymentMethodsRequiringAddress.join(', ')} transfers`
                : false,
            })}
            placeholder="Enter address line 2 (optional)"
          />
          {errors.addressLine2 && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.addressLine2.message}
            </p>
          )}
        </div>

        {/* Address Line 3 */}
        <div className="eb-space-y-2">
          <Label htmlFor="addressLine3">
            Address Line 3{isFieldRequired('addressLine3') && ' *'}
          </Label>
          <Input
            id="addressLine3"
            {...register('addressLine3', {
              required: isFieldRequired('addressLine3')
                ? `Address Line 3 is required for ${paymentMethodsRequiringAddress.join(', ')} transfers`
                : false,
            })}
            placeholder="Enter address line 3 (optional)"
          />
          {errors.addressLine3 && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.addressLine3.message}
            </p>
          )}
        </div>

        {/* City, State, Postal Code */}
        <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-3">
          <div className="eb-space-y-2">
            <Label htmlFor="city">City{isFieldRequired('city') && ' *'}</Label>
            <Input
              id="city"
              {...register('city', {
                required: isFieldRequired('city')
                  ? `City is required for ${paymentMethodsRequiringAddress.join(', ')} transfers`
                  : false,
              })}
              placeholder="Enter city"
              className={errors.city ? 'eb-border-red-500' : ''}
            />
            {errors.city && (
              <p className="eb-text-sm eb-text-red-500">
                {errors.city.message}
              </p>
            )}
          </div>

          <div className="eb-space-y-2">
            <Label htmlFor="state">
              State{isFieldRequired('state') && ' *'}
            </Label>
            <Input
              id="state"
              {...register('state', {
                required: isFieldRequired('state')
                  ? `State is required for ${paymentMethodsRequiringAddress.join(', ')} transfers`
                  : false,
              })}
              placeholder="Enter state"
              className={errors.state ? 'eb-border-red-500' : ''}
            />
            {errors.state && (
              <p className="eb-text-sm eb-text-red-500">
                {errors.state.message}
              </p>
            )}
          </div>

          <div className="eb-space-y-2">
            <Label htmlFor="postalCode">
              Postal Code{isFieldRequired('postalCode') && ' *'}
            </Label>
            <Input
              id="postalCode"
              {...register('postalCode', {
                required: isFieldRequired('postalCode')
                  ? `Postal Code is required for ${paymentMethodsRequiringAddress.join(', ')} transfers`
                  : false,
              })}
              placeholder="Enter postal code"
              className={errors.postalCode ? 'eb-border-red-500' : ''}
            />
            {errors.postalCode && (
              <p className="eb-text-sm eb-text-red-500">
                {errors.postalCode.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
