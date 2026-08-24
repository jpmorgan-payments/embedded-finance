import { CheckCircle2, RotateCcw } from 'lucide-react';

import type { MaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';
import { Button } from '@/components/ui/button';

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function DemoLifecyclePanel({
  projection,
  acceptedAt,
  isApproving,
  isResetting,
  onApprove,
  onReset,
}: {
  projection: MaintenanceProjection;
  acceptedAt?: string;
  isApproving: boolean;
  isResetting: boolean;
  onApprove: () => void;
  onReset: () => void;
}) {
  const activeStatuses = Array.from(
    new Set([
      ...projection.activeProposals.flatMap((party) =>
        party.updateRequest?.status ? [party.updateRequest.status] : []
      ),
      ...projection.productChanges.map((change) => change.source.status),
    ])
  );
  const activeChangeCount =
    projection.productChanges.length + projection.activeProposals.length;
  const readyToApprove =
    activeChangeCount > 0 &&
    projection.activeProposals.every(
      (party) => party.updateRequest?.status === 'REVIEW_IN_PROGRESS'
    ) &&
    projection.productChanges.every(
      (change) => change.source.status === 'REVIEW_IN_PROGRESS'
    );

  return (
    <aside
      aria-labelledby="demo-lifecycle-heading"
      className="rounded-md border border-dashed border-amber-400 bg-amber-50 p-4"
    >
      <p className="text-[11px] font-bold uppercase text-amber-800">
        Demo controls
      </p>
      <h2
        id="demo-lifecycle-heading"
        className="mt-1 font-semibold text-gray-950"
      >
        Asynchronous review
      </h2>
      <p className="mt-2 text-xs leading-5 text-gray-700">
        Verification moves the draft to review. Approval is a later server or
        webhook update; production profile data may take 24-48 hours to appear.
      </p>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-gray-600">Verification</dt>
          <dd className="text-right font-semibold text-gray-900">
            {acceptedAt ? '202 Accepted' : 'Not submitted'}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-gray-600">Active statuses</dt>
          <dd className="text-right font-semibold text-gray-900">
            {activeStatuses.length > 0
              ? activeStatuses.map(formatStatus).join(', ')
              : 'None'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!acceptedAt || !readyToApprove || isApproving}
          onClick={onApprove}
          className="justify-start bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <CheckCircle2 />
          Approve maintenance
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isResetting}
          onClick={onReset}
          className="justify-start text-gray-700"
        >
          <RotateCcw />
          Reset demo data
        </Button>
      </div>
    </aside>
  );
}
