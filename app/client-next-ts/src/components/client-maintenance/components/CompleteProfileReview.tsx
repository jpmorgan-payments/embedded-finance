import { Building2, UserRound } from 'lucide-react';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import type {
  EditablePartyPath,
  MaintenanceProjection,
} from '@/components/client-maintenance/utils/build-maintenance-projection';
import { formatMaintenanceValue } from '@/components/client-maintenance/utils/format-maintenance-value';
import { getMaintenancePartyName } from '@/components/client-maintenance/utils/maintenance-party-display';
import { Badge } from '@/components/ui/badge';

type DetailRow = {
  label: string;
  path: EditablePartyPath;
  value: unknown;
  sensitivity?: 'public' | 'masked';
};

function getPartyDetails(party: PartyResponse): DetailRow[] {
  if (party.partyType === 'ORGANIZATION') {
    return [
      {
        label: 'Legal business name',
        path: 'organizationDetails.organizationName',
        value: party.organizationDetails?.organizationName,
      },
      {
        label: 'Doing business as',
        path: 'organizationDetails.dbaName',
        value: party.organizationDetails?.dbaName,
      },
      {
        label: 'Organization type',
        path: 'organizationDetails.organizationType',
        value: party.organizationDetails?.organizationType,
      },
      {
        label: 'Business address',
        path: 'organizationDetails.addresses',
        value: party.organizationDetails?.addresses,
      },
      { label: 'Email', path: 'email', value: party.email },
    ];
  }

  return [
    {
      label: 'Name',
      path: 'individualDetails.firstName',
      value: getMaintenancePartyName(party),
    },
    {
      label: 'Date of birth',
      path: 'individualDetails.birthDate',
      value: party.individualDetails?.birthDate,
      sensitivity: 'masked',
    },
    {
      label: 'Job title',
      path: 'individualDetails.jobTitle',
      value: party.individualDetails?.jobTitle,
    },
    { label: 'Roles', path: 'roles', value: party.roles },
    { label: 'Email', path: 'email', value: party.email },
  ];
}

function ProfileSnapshot({
  title,
  description,
  parties,
  projection,
  proposed,
}: {
  title: string;
  description: string;
  parties: PartyResponse[];
  projection: MaintenanceProjection;
  proposed: boolean;
}) {
  const changesByParty = new Map(
    projection.partyChanges.map((change) => [change.partyId, change])
  );
  const client = proposed
    ? projection.proposedClient
    : projection.approvedClient;
  const productLabels = client.products.map((product) => {
    const details = client.productDetails?.find(
      (detail) => detail.product === product
    );
    return [product, details?.subProduct]
      .filter(Boolean)
      .join(' · ')
      .replaceAll('_', ' ');
  });

  return (
    <section
      aria-label={title}
      className={`overflow-hidden rounded-md border bg-white ${
        proposed ? 'border-cyan-300' : 'border-gray-200'
      }`}
    >
      <div
        className={`border-b px-4 py-3 ${
          proposed ? 'border-cyan-200 bg-cyan-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <h3 className="font-semibold text-gray-950">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-600">{description}</p>
      </div>

      <div className="border-b border-gray-200 p-4">
        <h4 className="text-xs font-semibold uppercase text-gray-500">
          Products
        </h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {productLabels.map((product) => (
            <Badge
              key={product}
              variant="outline"
              className={
                proposed && product.includes('LIMITED DDA PAYMENTS')
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-gray-200 bg-gray-50 text-gray-800'
              }
            >
              {product}
              {proposed && product.includes('LIMITED DDA PAYMENTS')
                ? ' · Proposed'
                : ''}
            </Badge>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {parties.map((party) => {
          const change = party.id ? changesByParty.get(party.id) : undefined;
          return (
            <article key={party.id} className="p-4">
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
                    className="shrink-0 border-amber-300 bg-amber-50 text-amber-900"
                  >
                    {change.removesParty
                      ? 'Proposed removal'
                      : change.action === 'ADD'
                        ? 'Proposed addition'
                        : `${change.fieldChanges.length || 1} ${change.fieldChanges.length === 1 ? 'change' : 'changes'}`}
                  </Badge>
                ) : null}
              </div>

              <dl className="mt-4 grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                {getPartyDetails(party).map((detail) => (
                  <div key={detail.label} className="min-w-0">
                    <dt className="text-xs font-medium text-gray-500">
                      {detail.label}
                    </dt>
                    <dd className="mt-0.5 break-words text-gray-900">
                      {formatMaintenanceValue(
                        detail.value,
                        detail.path,
                        detail.sensitivity ?? 'public'
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CompleteProfileReview({
  projection,
}: {
  projection: MaintenanceProjection;
}) {
  return (
    <section aria-labelledby="complete-profile-review-heading">
      <div className="mb-4">
        <h2
          id="complete-profile-review-heading"
          className="text-xl font-semibold text-gray-950"
        >
          Complete profile comparison
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Review each full profile to understand proposed changes in context.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProfileSnapshot
          title="Approved profile"
          description="Current persisted client and party data"
          parties={projection.approvedClient.parties}
          projection={projection}
          proposed={false}
        />
        <ProfileSnapshot
          title="Proposed profile"
          description="Presentation-only projection of the open request"
          parties={projection.proposedClient.parties}
          projection={projection}
          proposed
        />
      </div>
    </section>
  );
}
