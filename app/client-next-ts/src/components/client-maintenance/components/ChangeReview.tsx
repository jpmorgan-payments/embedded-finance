import { AlertTriangle, Pencil, UserMinus, UserPlus } from 'lucide-react';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import type {
  FieldChange,
  MaintenanceProjection,
  PartyChange,
} from '@/components/client-maintenance/utils/build-maintenance-projection';
import { formatMaintenanceValue } from '@/components/client-maintenance/utils/format-maintenance-value';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function actionClasses(action: PartyChange['action']): string {
  if (action === 'ADD')
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (action === 'DELETE') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-cyan-200 bg-cyan-50 text-cyan-800';
}

function RequestProvenance({ change }: { change: FieldChange }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
      <span>Source {change.source.requestId}</span>
      {change.supersededSources.length > 0 ? (
        <span className="inline-flex items-center gap-1 text-amber-800">
          <AlertTriangle className="h-3 w-3" />
          Supersedes{' '}
          {change.supersededSources
            .map((source) => source.requestId)
            .join(', ')}
        </span>
      ) : null}
    </div>
  );
}

function ComparisonRows({ changes }: { changes: FieldChange[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-md border border-gray-200 md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="w-1/4 px-4 py-3 font-semibold">Field</th>
              <th className="w-[37.5%] px-4 py-3 font-semibold">Approved</th>
              <th className="w-[37.5%] px-4 py-3 font-semibold">Proposed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {changes.map((change) => (
              <tr key={change.path} className="align-top">
                <th scope="row" className="px-4 py-4 font-medium text-gray-900">
                  {change.label}
                  <RequestProvenance change={change} />
                </th>
                <td className="break-words px-4 py-4 text-gray-600">
                  {formatMaintenanceValue(
                    change.approvedValue,
                    change.path,
                    change.sensitivity
                  )}
                </td>
                <td className="break-words border-l-2 border-sp-brand bg-sp-accent/50 px-4 py-4 font-medium text-gray-950">
                  {formatMaintenanceValue(
                    change.proposedValue,
                    change.path,
                    change.sensitivity
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {changes.map((change) => (
          <div
            key={change.path}
            className="rounded-md border border-gray-200 p-4"
          >
            <h4 className="font-medium text-gray-950">{change.label}</h4>
            <RequestProvenance change={change} />
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">
                  Approved
                </dt>
                <dd className="mt-1 text-gray-700">
                  {formatMaintenanceValue(
                    change.approvedValue,
                    change.path,
                    change.sensitivity
                  )}
                </dd>
              </div>
              <div className="border-l-2 border-sp-brand bg-sp-accent/50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase text-sp-brand">
                  Proposed
                </dt>
                <dd className="mt-1 font-medium text-gray-950">
                  {formatMaintenanceValue(
                    change.proposedValue,
                    change.path,
                    change.sensitivity
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

export function ChangeReview({
  projection,
  onEditParty,
}: {
  projection: MaintenanceProjection;
  onEditParty: (party: PartyResponse) => void;
}) {
  return (
    <section aria-labelledby="change-review-heading">
      <div className="mb-4">
        <h2
          id="change-review-heading"
          className="text-xl font-semibold text-gray-950"
        >
          Approved and proposed details
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Only changed fields are shown. Proposed values do not replace the
          approved profile until review completes.
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={projection.partyChanges.map((change) => change.partyId)}
        className="overflow-hidden rounded-md border border-gray-200 bg-white"
      >
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
                <Badge
                  variant="outline"
                  className={actionClasses(partyChange.action)}
                >
                  {partyChange.action}
                </Badge>
                <span className="text-xs font-normal text-gray-500">
                  {partyChange.fieldChanges.length}{' '}
                  {partyChange.fieldChanges.length === 1 ? 'field' : 'fields'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {partyChange.action === 'DELETE' ? (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <UserMinus className="mt-0.5 h-4 w-4 shrink-0" />
                  This approved party is proposed for removal. The party remains
                  visible until the request is approved.
                </div>
              ) : partyChange.action === 'ADD' ? (
                <div className="mb-3 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <UserPlus className="mt-0.5 h-4 w-4 shrink-0" />
                  This is a proposed new party and is not part of the approved
                  profile yet.
                </div>
              ) : null}

              {partyChange.fieldChanges.length > 0 ? (
                <ComparisonRows changes={partyChange.fieldChanges} />
              ) : null}

              {partyChange.proposedParty ? (
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
