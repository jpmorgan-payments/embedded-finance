import { Building2, Pencil, ShieldCheck, UserRound } from 'lucide-react';

import type { MaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { PartyResponse } from '../models/maintenance-api';

function partyName(party: PartyResponse): string {
  return (
    party.organizationDetails?.organizationName ??
    [party.individualDetails?.firstName, party.individualDetails?.lastName]
      .filter(Boolean)
      .join(' ') ??
    'Unnamed party'
  );
}

function partyDescription(party: PartyResponse): string {
  if (party.partyType === 'ORGANIZATION') {
    return [
      party.organizationDetails?.organizationType?.replaceAll('_', ' '),
      party.organizationDetails?.countryOfFormation,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return [party.individualDetails?.jobTitle, ...(party.roles ?? [])]
    .filter(Boolean)
    .map((value) => String(value).replaceAll('_', ' '))
    .join(' · ');
}

export function ProfileOverview({
  projection,
  onEditParty,
  onReview,
}: {
  projection: MaintenanceProjection;
  onEditParty: (party: PartyResponse) => void;
  onReview: () => void;
}) {
  const organization = projection.proposedClient.parties.find(
    (party) => party.partyType === 'ORGANIZATION'
  );
  const people = projection.proposedClient.parties.filter(
    (party) => party.partyType === 'INDIVIDUAL'
  );
  const changeCount = projection.partyChanges.reduce(
    (total, party) =>
      total +
      Math.max(party.fieldChanges.length, party.action === 'DELETE' ? 1 : 0),
    0
  );

  const renderParty = (party: PartyResponse) => {
    const changes = projection.partyChanges.find(
      (change) => change.partyId === party.id
    );
    return (
      <article
        key={party.id}
        className="grid gap-4 border-b border-gray-200 px-4 py-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sp-accent text-sp-brand">
            {party.partyType === 'ORGANIZATION' ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-950">
                {partyName(party)}
              </h3>
              {changes ? (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-900"
                >
                  {changes.fieldChanges.length || 1}{' '}
                  {changes.fieldChanges.length === 1 ? 'change' : 'changes'}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-800"
                >
                  Current
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm capitalize text-gray-600">
              {partyDescription(party)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{party.email}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEditParty(party)}
          aria-label={`Edit ${partyName(party)}`}
        >
          <Pencil />
          Edit
        </Button>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-l-4 border-sp-brand bg-sp-accent px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sp-brand" />
          <div>
            <h2 className="font-semibold text-gray-950">
              Approved profile with pending maintenance
            </h2>
            <p className="mt-1 text-sm text-gray-700">
              {changeCount} proposed {changeCount === 1 ? 'change' : 'changes'}{' '}
              across {projection.partyChanges.length}{' '}
              {projection.partyChanges.length === 1 ? 'party' : 'parties'}.
            </p>
          </div>
        </div>
        <Button type="button" onClick={onReview} disabled={changeCount === 0}>
          Review proposed changes
        </Button>
      </div>

      <section aria-labelledby="organization-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="organization-heading"
            className="text-sm font-semibold text-gray-950"
          >
            Organization
          </h2>
          <span className="text-xs text-gray-500">Approved client</span>
        </div>
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {organization ? renderParty(organization) : null}
        </div>
      </section>

      <section aria-labelledby="people-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="people-heading"
            className="text-sm font-semibold text-gray-950"
          >
            People
          </h2>
          <span className="text-xs text-gray-500">
            {people.length} associated
          </span>
        </div>
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {people.map(renderParty)}
        </div>
      </section>
    </div>
  );
}
