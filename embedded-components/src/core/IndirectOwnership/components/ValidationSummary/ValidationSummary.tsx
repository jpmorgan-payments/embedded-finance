import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { OwnershipValidationStatus } from '../../types';

interface ValidationSummaryProps {
  validationStatus?: OwnershipValidationStatus;
  onFixError?: (errorCode: string) => void;
}

/**
 * Placeholder component for ownership validation summary
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validationStatus,
  // onFixError,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="eb-rounded-lg eb-border-2 eb-border-dashed eb-border-muted eb-p-4 eb-text-center">
          <div className="eb-text-sm eb-text-muted-foreground">
            Validation summary coming soon...
          </div>
          {validationStatus && (
            <div className="eb-mt-2 eb-text-xs eb-text-muted-foreground">
              Valid: {validationStatus.isValid ? 'Yes' : 'No'} | Status:{' '}
              {validationStatus.completionLevel}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
