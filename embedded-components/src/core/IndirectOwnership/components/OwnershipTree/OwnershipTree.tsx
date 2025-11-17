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
  onNodeSelect,
  expandedNodes,
  onNodeToggle,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership Tree</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
          <div className="text-sm text-muted-foreground">
            Ownership tree visualization coming soon...
          </div>
          {ownershipStructure && (
            <div className="mt-2 text-xs text-muted-foreground">
              Client ID: {ownershipStructure.clientId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
