import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { OwnershipEntityFormData } from '../../types';

interface EntityFormProps {
  onSubmit?: (data: OwnershipEntityFormData) => void;
  initialData?: Partial<OwnershipEntityFormData>;
  parentPartyId?: string;
  isLoading?: boolean;
}

/**
 * Placeholder component for entity/individual form
 */
export const EntityForm: React.FC<EntityFormProps> = ({
  onSubmit,
  initialData,
  parentPartyId,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Entity/Individual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
          <div className="text-sm text-muted-foreground">
            Entity/Individual form coming soon...
          </div>
          {parentPartyId && (
            <div className="mt-2 text-xs text-muted-foreground">
              Parent Party: {parentPartyId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
