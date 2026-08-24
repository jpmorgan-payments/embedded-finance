import { useState } from 'react';
import { Columns2, ListChecks, Rows3 } from 'lucide-react';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import type { MaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ChangeReview } from './ChangeReview';
import { CompleteProfileReview } from './CompleteProfileReview';
import { RequestTaskReview } from './RequestTaskReview';

type ReviewMode = 'fields' | 'profiles' | 'request';

const REVIEW_OPTIONS: Record<
  ReviewMode,
  { bestFor: string; tradeoff: string }
> = {
  fields: {
    bestFor: 'Fast, precise validation of every changed value.',
    tradeoff: 'Unchanged profile context stays out of view.',
  },
  profiles: {
    bestFor: 'Holistic or legal review of the complete client profile.',
    tradeoff: 'Repeats unchanged data and becomes longer on mobile.',
  },
  request: {
    bestFor: 'Task-oriented and mobile workflows organized by request.',
    tradeoff: 'Reviewers must expand a party before seeing every value.',
  },
};

export function MaintenanceReviewOptions({
  projection,
  onEditParty,
}: {
  projection: MaintenanceProjection;
  onEditParty: (party: PartyResponse) => void;
}) {
  const [mode, setMode] = useState<ReviewMode>('fields');
  const requestId =
    projection.activeProposals[0]?.updateRequest?.requestId ?? 'unavailable';
  const option = REVIEW_OPTIONS[mode];

  return (
    <section aria-labelledby="review-options-heading">
      <div className="mb-4">
        <h2
          id="review-options-heading"
          className="text-xl font-semibold text-gray-950"
        >
          Compare review patterns
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Each option renders the same proposed values.{' '}
          <code className="font-semibold text-gray-900">
            Maintenance request {requestId}
          </code>{' '}
          groups every change in this draft.
        </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as ReviewMode)}
      >
        <TabsList
          aria-label="Review presentation options"
          className="grid h-auto w-full grid-cols-3 bg-gray-100 p-1"
        >
          <TabsTrigger value="fields" className="min-h-11 gap-1.5 px-2">
            <ListChecks className="h-4 w-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="profiles" className="min-h-11 gap-1.5 px-2">
            <Columns2 className="h-4 w-4" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="request" className="min-h-11 gap-1.5 px-2">
            <Rows3 className="h-4 w-4" />
            Request
          </TabsTrigger>
        </TabsList>

        <div role="note" className="border-l-4 border-cyan-500 bg-cyan-50 p-3">
          <p className="text-sm text-cyan-950">
            <strong>Best for:</strong> {option.bestFor}{' '}
            <span className="text-cyan-800">
              <strong>Trade-off:</strong> {option.tradeoff}
            </span>
          </p>
        </div>

        <TabsContent value="fields" className="mt-5">
          <ChangeReview projection={projection} onEditParty={onEditParty} />
        </TabsContent>
        <TabsContent value="profiles" className="mt-5">
          <CompleteProfileReview projection={projection} />
        </TabsContent>
        <TabsContent value="request" className="mt-5">
          <RequestTaskReview
            projection={projection}
            onEditParty={onEditParty}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
