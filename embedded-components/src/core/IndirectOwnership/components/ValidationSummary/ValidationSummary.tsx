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
  onFixError,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
          <div className="text-sm text-muted-foreground">
            Validation summary coming soon...
          </div>
          {validationStatus && (
            <div className="mt-2 text-xs text-muted-foreground">
              Valid: {validationStatus.isValid ? 'Yes' : 'No'} | 
              Status: {validationStatus.completionLevel}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
