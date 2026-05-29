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
  // onSubmit,
  // initialData,
  parentPartyId,
  // isLoading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Entity/Individual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="eb-rounded-lg eb-border-2 eb-border-dashed eb-border-muted eb-p-4 eb-text-center">
          <div className="eb-text-sm eb-text-muted-foreground">
            Entity/Individual form coming soon...
          </div>
          {parentPartyId && (
            <div className="eb-mt-2 eb-text-xs eb-text-muted-foreground">
              Parent Party: {parentPartyId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
