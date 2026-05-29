import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { OwnershipStructure } from '../../types';

interface OwnershipTreeProps {
  ownershipStructure?: OwnershipStructure | null;
  onNodeSelect?: (nodeId: string) => void;
  expandedNodes?: Set<string>;
  onNodeToggle?: (nodeId: string) => void;
}

/**
 * Placeholder component for ownership tree visualization
 */
export const OwnershipTree: React.FC<OwnershipTreeProps> = ({
  ownershipStructure,
  // onNodeSelect,
  // expandedNodes,
  // onNodeToggle,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership Tree</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="eb-rounded-lg eb-border-2 eb-border-dashed eb-border-muted eb-p-4 eb-text-center">
          <div className="eb-text-sm eb-text-muted-foreground">
            Ownership tree visualization coming soon...
          </div>
          {ownershipStructure && (
            <div className="eb-mt-2 eb-text-xs eb-text-muted-foreground">
              Client ID: {ownershipStructure.clientId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
