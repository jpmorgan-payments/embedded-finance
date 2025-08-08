import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type {
  OnboardingCriteria,
  CriteriaOptions,
  ClientProduct,
  CountryCode,
  OrganizationType,
} from '../types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import criteriaMapping from '../data/criteria-mapping.json';

interface CriteriaSelectorProps {
  onCriteriaChange: (criteria: OnboardingCriteria) => void;
  availableOptions: CriteriaOptions;
  isLoading?: boolean;
  className?: string;
}

interface ValidationError {
  field: keyof OnboardingCriteria;
  message: string;
}

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({
  onCriteriaChange,
  availableOptions,
  isLoading = false,
  className,
}) => {
  const [product, setProduct] = useState<ClientProduct | ''>('');
  const [jurisdiction, setJurisdiction] = useState<CountryCode | ''>('');
  const [legalEntityType, setLegalEntityType] = useState<OrganizationType | ''>(
    '',
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [isValidating, setIsValidating] = useState(false);

  // Generate criteria combination key
  const generateCriteriaKey = (
    p: ClientProduct,
    j: CountryCode,
    l: OrganizationType,
  ): string => {
    return `${p}-${j}-${l}`;
  };

  // Check if a criteria combination is supported
  const isCombinationSupported = useMemo(() => {
    if (!product || !jurisdiction || !legalEntityType) return true; // Don't show error until all fields are selected

    const key = generateCriteriaKey(product, jurisdiction, legalEntityType);
    return criteriaMapping.supportedCombinations.includes(key);
  }, [product, jurisdiction, legalEntityType]);

  // Get available options based on current selections
  const getFilteredOptions = useMemo(() => {
    const validationRules = criteriaMapping.validationRules;

    // Filter jurisdictions based on selected product
    const availableJurisdictions = product
      ? validationRules.productConstraints[product]?.supportedJurisdictions ||
        availableOptions.jurisdictions
      : availableOptions.jurisdictions;

    // Filter legal entity types based on selected product
    const availableLegalEntityTypes = product
      ? validationRules.productConstraints[product]?.supportedEntityTypes ||
        availableOptions.legalEntityTypes
      : availableOptions.legalEntityTypes;

    return {
      jurisdictions: availableJurisdictions,
      legalEntityTypes: availableLegalEntityTypes,
    };
  }, [product, availableOptions]);

  // Format display names for options
  const formatDisplayName = (value: string): string => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Validate form and criteria combination
  const validateCriteria = async (): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    // Check required fields
    if (!product) {
      errors.push({ field: 'product', message: 'Product type is required' });
    }
    if (!jurisdiction) {
      errors.push({
        field: 'jurisdiction',
        message: 'Jurisdiction is required',
      });
    }
    if (!legalEntityType) {
      errors.push({
        field: 'legalEntityType',
        message: 'Legal entity type is required',
      });
    }

    // Check combination validity if all fields are filled
    if (product && jurisdiction && legalEntityType && !isCombinationSupported) {
      errors.push({
        field: 'product', // We'll show this as a general error
        message: `The combination of ${formatDisplayName(product)}, ${jurisdiction}, and ${formatDisplayName(legalEntityType)} is not currently supported.`,
      });
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!product || !jurisdiction || !legalEntityType) return;

    setIsValidating(true);
    const errors = await validateCriteria();

    if (errors.length === 0) {
      onCriteriaChange({
        product,
        jurisdiction,
        legalEntityType,
      });
      setValidationErrors([]);
    } else {
      setValidationErrors(errors);
    }

    setIsValidating(false);
  };

  // Clear validation errors when selections change
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [product, jurisdiction, legalEntityType]);

  // Reset dependent selections when parent selection changes
  useEffect(() => {
    if (
      product &&
      jurisdiction &&
      !getFilteredOptions.jurisdictions.includes(jurisdiction)
    ) {
      setJurisdiction('');
    }
  }, [product, getFilteredOptions.jurisdictions]);

  useEffect(() => {
    if (
      product &&
      legalEntityType &&
      !getFilteredOptions.legalEntityTypes.includes(legalEntityType)
    ) {
      setLegalEntityType('');
    }
  }, [product, getFilteredOptions.legalEntityTypes]);

  const isFormValid =
    product && jurisdiction && legalEntityType && isCombinationSupported;
  const hasGeneralError = validationErrors.some(
    (error) =>
      error.message.includes('combination') ||
      error.message.includes('supported'),
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Select Your Onboarding Criteria
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose your product type, jurisdiction, and legal entity type to see
          the relevant API journey.
        </p>
      </div>

      {/* General error message */}
      {hasGeneralError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-600">
            {
              validationErrors.find(
                (error) =>
                  error.message.includes('combination') ||
                  error.message.includes('supported'),
              )?.message
            }
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Selection */}
        <div className="space-y-2">
          <label
            htmlFor="product-select"
            className="block text-sm font-medium mb-1"
          >
            Product Type <span className="text-red-500">*</span>
          </label>
          <select
            id="product-select"
            value={product}
            onChange={(e) => setProduct(e.target.value as ClientProduct)}
            disabled={isLoading}
            className={cn(
              'border border-gray-300 rounded-md px-3 py-2 w-full',
              validationErrors.some(
                (e) =>
                  e.field === 'product' && !e.message.includes('combination'),
              ) && 'border-red-500',
            )}
          >
            <option value="">Select product type</option>
            {availableOptions.products.map((p) => (
              <option key={p} value={p}>
                {formatDisplayName(p)}
              </option>
            ))}
          </select>
          {validationErrors.find(
            (e) => e.field === 'product' && !e.message.includes('combination'),
          ) && (
            <p className="text-sm text-red-600">
              {
                validationErrors.find(
                  (e) =>
                    e.field === 'product' && !e.message.includes('combination'),
                )?.message
              }
            </p>
          )}
        </div>

        {/* Jurisdiction Selection */}
        <div className="space-y-2">
          <label
            htmlFor="jurisdiction-select"
            className="block text-sm font-medium mb-1"
          >
            Jurisdiction <span className="text-red-500">*</span>
          </label>
          <select
            id="jurisdiction-select"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value as CountryCode)}
            disabled={isLoading || !product}
            className={cn(
              'border border-gray-300 rounded-md px-3 py-2 w-full',
              validationErrors.some((e) => e.field === 'jurisdiction') &&
                'border-red-500',
            )}
          >
            <option value="">Select jurisdiction</option>
            {getFilteredOptions.jurisdictions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
          {validationErrors.find((e) => e.field === 'jurisdiction') && (
            <p className="text-sm text-red-600">
              {
                validationErrors.find((e) => e.field === 'jurisdiction')
                  ?.message
              }
            </p>
          )}
          {!product && (
            <p className="text-sm text-muted-foreground">
              Select a product type first
            </p>
          )}
        </div>

        {/* Legal Entity Type Selection */}
        <div className="space-y-2">
          <label
            htmlFor="entity-select"
            className="block text-sm font-medium mb-1"
          >
            Legal Entity Type <span className="text-red-500">*</span>
          </label>
          <select
            id="entity-select"
            value={legalEntityType}
            onChange={(e) =>
              setLegalEntityType(e.target.value as OrganizationType)
            }
            disabled={isLoading || !product}
            className={cn(
              'border border-gray-300 rounded-md px-3 py-2 w-full',
              validationErrors.some((e) => e.field === 'legalEntityType') &&
                'border-red-500',
            )}
          >
            <option value="">Select entity type</option>
            {getFilteredOptions.legalEntityTypes.map((l) => (
              <option key={l} value={l}>
                {formatDisplayName(l)}
              </option>
            ))}
          </select>
          {validationErrors.find((e) => e.field === 'legalEntityType') && (
            <p className="text-sm text-red-600">
              {
                validationErrors.find((e) => e.field === 'legalEntityType')
                  ?.message
              }
            </p>
          )}
          {!product && (
            <p className="text-sm text-muted-foreground">
              Select a product type first
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading || isValidating}
        >
          {(isLoading || isValidating) && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          {isLoading
            ? 'Loading...'
            : isValidating
              ? 'Validating...'
              : 'Generate Journey'}
        </Button>
      </div>

      {/* Combination preview */}
      {product && jurisdiction && legalEntityType && isCombinationSupported && (
        <div className="p-3 bg-muted rounded-md border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Selected combination:</span>{' '}
            {formatDisplayName(product)} • {jurisdiction} •{' '}
            {formatDisplayName(legalEntityType)}
          </p>
        </div>
      )}
    </div>
  );
};
