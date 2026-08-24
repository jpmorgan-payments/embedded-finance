import { PackagePlus, Pencil } from 'lucide-react';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import type { MaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';
import { formatMaintenanceValue } from '@/components/client-maintenance/utils/format-maintenance-value';
import { formatMaintenanceStatus } from '@/components/client-maintenance/utils/maintenance-party-display';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RequestTaskReview({
  projection,
  onEditParty,
}: {
  projection: MaintenanceProjection;
  onEditParty: (party: PartyResponse) => void;
}) {
  const request = projection.activeProposals[0]?.updateRequest;
  const productSource = projection.productChanges[0]?.source;
  const requestId =
    request?.requestId ?? productSource?.requestId ?? 'Unavailable';
  const status = request?.status ?? productSource?.status ?? 'NEW';
  const changeCount =
    projection.productChanges.length +
    projection.partyChanges.reduce(
      (total, party) => total + Math.max(1, party.fieldChanges.length),
      0
    );
  const taskCount =
    projection.productChanges.length + projection.partyChanges.length;

  return (
    <section aria-labelledby="request-task-review-heading">
      <div className="mb-4 border-l-4 border-sp-brand bg-sp-accent px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-sp-brand">
              One open maintenance request
            </p>
            <h2
              id="request-task-review-heading"
              className="mt-1 text-xl font-semibold text-gray-950"
            >
              Maintenance request {requestId}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-700">
              This request groups all {changeCount} draft changes into{' '}
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-cyan-300 bg-white text-cyan-900"
          >
            {formatMaintenanceStatus(status)}
          </Badge>
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        className="overflow-hidden rounded-md border border-gray-200 bg-white"
      >
        {projection.productChanges.map((productChange) => {
          const value = `product-${productChange.product}-${productChange.subProduct}`;
          return (
            <AccordionItem
              key={value}
              value={value}
              className="px-4 last:border-b-0 sm:px-5"
            >
              <AccordionTrigger className="gap-3 text-left hover:no-underline">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-950">
                    Limited DDA Payments
                  </span>
                  <Badge variant="outline">ADD</Badge>
                  <span className="text-xs font-normal text-gray-500">
                    Product task
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex items-start gap-3 border-y border-gray-200 py-4 text-sm text-gray-700">
                  <PackagePlus className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  Add Embedded Payments with the Limited DDA Payments
                  sub-product.
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
        {projection.partyChanges.map((partyChange) => (
          <AccordionItem
            key={partyChange.partyId}
            value={partyChange.partyId}
            className="px-4 last:border-b-0 sm:px-5"
          >
            <AccordionTrigger className="gap-3 text-left hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-950">
                  {partyChange.partyName}
                </span>
                <Badge variant="outline">
                  {partyChange.removesParty ? 'REMOVE' : partyChange.action}
                </Badge>
                <span className="text-xs font-normal text-gray-500">
                  {partyChange.fieldChanges.length || 1}{' '}
                  {partyChange.fieldChanges.length === 1 ? 'change' : 'changes'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <dl className="divide-y divide-gray-200 border-y border-gray-200 text-sm">
                {partyChange.fieldChanges.map((change) => (
                  <div
                    key={change.path}
                    className="grid gap-2 py-3 sm:grid-cols-[10rem_1fr]"
                  >
                    <dt className="font-medium text-gray-900">
                      {change.label}
                    </dt>
                    <dd className="min-w-0 text-gray-700">
                      <span className="break-words">
                        {formatMaintenanceValue(
                          change.approvedValue,
                          change.path,
                          change.sensitivity
                        )}
                      </span>{' '}
                      <span aria-hidden="true">&rarr;</span>{' '}
                      <strong className="break-words font-semibold text-gray-950">
                        {formatMaintenanceValue(
                          change.proposedValue,
                          change.path,
                          change.sensitivity
                        )}
                      </strong>
                    </dd>
                  </div>
                ))}
              </dl>

              {partyChange.proposedParty &&
              partyChange.action === 'MODIFY' &&
              !partyChange.removesParty ? (
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEditParty(partyChange.proposedParty!)}
                  >
                    <Pencil />
                    Edit proposed details
                  </Button>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
