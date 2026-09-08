import { Building2, UserMinus, UserPlus, UserRound } from 'lucide-react';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import type {
  FieldChange,
  MaintenanceProjection,
} from '@/components/client-maintenance/utils/build-maintenance-projection';
import { formatMaintenanceValue } from '@/components/client-maintenance/utils/format-maintenance-value';
import { getMaintenancePartyName } from '@/components/client-maintenance/utils/maintenance-party-display';
import { Badge } from '@/components/ui/badge';

import { getPartyDetails } from './CompleteProfileReview';

function ChangedValue({ change }: { change: FieldChange }) {
  return (
    <dd className="mt-0.5 rounded-sm border-l-2 border-amber-500 bg-amber-50 px-2 py-1">
      <span className="break-words font-medium text-amber-950">
        {formatMaintenanceValue(
          change.proposedValue,
          change.path,
          change.sensitivity
        )}
      </span>
      <span className="mt-0.5 block text-xs text-amber-900">
        Approved value:{' '}
        <span className="line-through">
          {formatMaintenanceValue(
            change.approvedValue,
            change.path,
            change.sensitivity
          )}
        </span>
      </span>
    </dd>
  );
}

export function HighlightedProfileReview({
  projection,
}: {
  projection: MaintenanceProjection;
}) {
  const changesByParty = new Map(
    projection.partyChanges.map((change) => [change.partyId, change])
  );
  const proposedProductKeys = new Set(
    projection.productChanges.map(
      (change) => `${change.product}:${change.subProduct ?? ''}`
    )
  );
  const client = projection.proposedClient;
  const productLabels =
    client.productDetails?.map((detail) => ({
      key: `${detail.product}:${detail.subProduct ?? ''}`,
      label: [detail.product, detail.subProduct]
        .filter(Boolean)
        .join(' · ')
        .replaceAll('_', ' '),
    })) ?? client.products.map((product) => ({ key: product, label: product }));

  const renderParty = (party: PartyResponse) => {
    const change = party.id ? changesByParty.get(party.id) : undefined;
    const changeByPath = new Map(
      (change?.fieldChanges ?? []).map((field) => [field.path, field])
    );

    return (
      <article
        key={party.id}
        className={`p-4 ${change?.removesParty ? 'bg-red-50/60' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700">
              {party.partyType === 'ORGANIZATION' ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <UserRound className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-950">
                {getMaintenancePartyName(party)}
              </h4>
              <p className="mt-0.5 text-xs text-gray-500">
                {party.partyType === 'ORGANIZATION'
                  ? 'Organization'
                  : 'Related person'}
              </p>
            </div>
          </div>
          {change ? (
            <Badge
              variant="outline"
              className={`shrink-0 gap-1 ${
                change.removesParty
                  ? 'border-red-300 bg-red-50 text-red-900'
                  : change.action === 'ADD'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-amber-400 bg-amber-50 text-amber-900'
              }`}
            >
              {change.removesParty ? (
                <>
                  <UserMinus className="h-3 w-3" />
                  Proposed removal
                </>
              ) : change.action === 'ADD' ? (
                <>
                  <UserPlus className="h-3 w-3" />
                  New party
                </>
              ) : (
                `${change.fieldChanges.length} changed`
              )}
            </Badge>
          ) : null}
        </div>

        <dl className="mt-4 grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          {getPartyDetails(party).map((detail) => {
            const fieldChange = changeByPath.get(detail.path);
            return (
              <div key={detail.label} className="min-w-0">
                <dt
                  className={`text-xs font-medium ${
                    fieldChange ? 'text-amber-900' : 'text-gray-500'
                  }`}
                >
                  {detail.label}
                  {fieldChange ? (
                    <span className="ml-1 font-semibold uppercase">
                      · Changed
                    </span>
                  ) : null}
                </dt>
                {fieldChange ? (
                  <ChangedValue change={fieldChange} />
                ) : (
                  <dd className="mt-0.5 break-words text-gray-900">
                    {formatMaintenanceValue(
                      detail.value,
                      detail.path,
                      detail.sensitivity ?? 'public'
                    )}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </article>
    );
  };

  return (
    <section aria-labelledby="highlighted-profile-heading">
      <div className="mb-4">
        <h2
          id="highlighted-profile-heading"
          className="text-xl font-semibold text-gray-950"
        >
          Highlighted profile
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          One profile as it will read after approval. Changed attributes are
          highlighted in place and carry a Changed label, so the colour is never
          the only signal.
        </p>
      </div>

      <section
        aria-label="Proposed profile with highlighted changes"
        className="overflow-hidden rounded-md border border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-xs font-semibold uppercase text-gray-500">
            Products
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {productLabels.map((product) => {
              const isProposed = proposedProductKeys.has(product.key);
              return (
                <Badge
                  key={product.key}
                  variant="outline"
                  className={
                    isProposed
                      ? 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-gray-200 bg-gray-50 text-gray-800'
                  }
                >
                  {product.label}
                  {isProposed ? ' · Added' : ''}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {client.parties.map(renderParty)}
        </div>
      </section>
    </section>
  );
}
