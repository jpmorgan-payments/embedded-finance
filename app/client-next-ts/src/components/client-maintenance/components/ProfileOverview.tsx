import { useState } from 'react';
import {
  Building2,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react';

import type { MaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  onRequestProduct,
  onAddParty,
  onRemoveParty,
  disclosureAnswer,
  onDisclosureAnswerChange,
  onLoadCompleteStory,
  isOperating,
  operationError,
}: {
  projection: MaintenanceProjection;
  onEditParty: (party: PartyResponse) => void;
  onReview: () => void;
  onRequestProduct: () => void;
  onAddParty: () => void;
  onRemoveParty: (partyId: string) => Promise<void>;
  disclosureAnswer?: 'yes' | 'no';
  onDisclosureAnswerChange: (answer: 'yes' | 'no') => void;
  onLoadCompleteStory: () => void;
  isOperating: boolean;
  operationError?: string;
}) {
  const [partyToRemove, setPartyToRemove] = useState<PartyResponse>();
  const proposedById = new Map(
    projection.proposedClient.parties.flatMap((party) =>
      party.id ? [[party.id, party] as const] : []
    )
  );
  const visibleParties = projection.approvedClient.parties.map(
    (party) => (party.id ? proposedById.get(party.id) : undefined) ?? party
  );
  const approvedIds = new Set(
    projection.approvedClient.parties.flatMap((party) =>
      party.id ? [party.id] : []
    )
  );
  visibleParties.push(
    ...projection.proposedClient.parties.filter(
      (party) => !party.id || !approvedIds.has(party.id)
    )
  );
  const organization = visibleParties.find(
    (party) => party.partyType === 'ORGANIZATION'
  );
  const people = visibleParties.filter(
    (party) => party.partyType === 'INDIVIDUAL'
  );
  const partyChangeCount = projection.partyChanges.reduce(
    (total, party) => total + Math.max(1, party.fieldChanges.length),
    0
  );
  const changeCount = projection.productChanges.length + partyChangeCount;
  const limitedDdaRequested = projection.productChanges.some(
    (change) => change.subProduct === 'LIMITED_DDA'
  );
  const limitedDdaApproved =
    projection.approvedClient.productDetails?.some(
      (detail) => detail.subProduct === 'LIMITED_DDA'
    ) ?? false;
  const hasPartyDisclosures = projection.partyChanges.length > 0;
  const canReview =
    changeCount > 0 && limitedDdaRequested && disclosureAnswer !== undefined;
  const examplePartyAdded = visibleParties.some(
    (party) => party.email === 'sam.lee@marketplacevendor.example'
  );

  const renderParty = (party: PartyResponse) => {
    const changes = projection.partyChanges.find(
      (change) => change.partyId === party.id
    );
    const isApprovedParty = party.id ? approvedIds.has(party.id) : false;
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
              {isApprovedParty ? (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-800"
                >
                  Approved
                </Badge>
              ) : null}
              {changes ? (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-900"
                >
                  {changes.action === 'ADD'
                    ? 'New party · pending approval'
                    : changes.removesParty
                      ? 'Removal requested'
                      : `${changes.fieldChanges.length || 1} ${changes.fieldChanges.length === 1 ? 'change' : 'changes'}`}
                </Badge>
              ) : (
                !isApprovedParty && <Badge variant="outline">Current</Badge>
              )}
            </div>
            <p className="mt-1 text-sm capitalize text-gray-600">
              {partyDescription(party)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{party.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {!changes?.removesParty && changes?.action !== 'ADD' ? (
            disclosureAnswer === 'yes' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditParty(party)}
                aria-label={`Edit ${partyName(party)}`}
                disabled={isOperating}
              >
                <Pencil />
                Edit
              </Button>
            ) : null
          ) : null}
          {disclosureAnswer === 'yes' &&
          party.partyType === 'INDIVIDUAL' &&
          changes?.action !== 'ADD' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPartyToRemove(party)}
              aria-label={`Remove ${partyName(party)}`}
              disabled={isOperating || changes?.removesParty}
              className="text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 />
              {changes?.removesParty ? 'Removal requested' : 'Remove'}
            </Button>
          ) : null}
        </div>
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
              {changeCount > 0
                ? 'Product and disclosure request in progress'
                : 'Start the product addition'}
            </h2>
            <p className="mt-1 text-sm text-gray-700">
              {changeCount > 0
                ? `${changeCount} proposed ${changeCount === 1 ? 'change' : 'changes'} across products and parties.`
                : 'Request Limited DDA, then confirm whether anything changed since the previous approval.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadCompleteStory}
            disabled={isOperating}
          >
            {isOperating ? <Loader2 className="animate-spin" /> : <Layers3 />}
            Load complete story
          </Button>
          <Button type="button" onClick={onReview} disabled={!canReview}>
            Review proposed changes
          </Button>
        </div>
      </div>

      {operationError ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {operationError}
        </p>
      ) : null}

      <section aria-labelledby="products-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="products-heading"
            className="text-sm font-semibold text-gray-950"
          >
            Products
          </h2>
          <span className="text-xs text-gray-500">
            Client-level maintenance
          </span>
        </div>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-950">
                  Limited DDA Payments
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Embedded Payments sub-product · Approved
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              Current
            </Badge>
          </div>
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-800">
                <Plus className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-950">Limited DDA</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Additional Embedded Payments sub-product
                </p>
              </div>
            </div>
            {limitedDdaRequested || limitedDdaApproved ? (
              <Badge
                variant="outline"
                className={`w-fit ${
                  limitedDdaApproved
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-300 bg-amber-50 text-amber-900'
                }`}
              >
                {limitedDdaApproved ? 'Current' : 'Proposed addition'}
              </Badge>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRequestProduct}
                disabled={isOperating}
              >
                <Plus />
                Request sub-product
              </Button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="disclosure-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="disclosure-heading"
            className="text-sm font-semibold text-gray-950"
          >
            Changes since previous approval
          </h2>
          <span className="text-xs text-gray-500">Required disclosure</span>
        </div>
        <fieldset
          disabled={!limitedDdaRequested || isOperating}
          className="rounded-md border border-gray-200 bg-white p-4 disabled:bg-gray-50"
        >
          <legend className="px-1 font-semibold text-gray-950">
            Has anything changed since your previous approval?
          </legend>
          <p className="mt-1 text-sm text-gray-600">
            Include changes to the organization and its related parties. All
            disclosed party changes use a separate maintenance request from the
            new sub-product.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                disclosureAnswer === 'no'
                  ? 'border-sp-brand bg-sp-accent'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="radio"
                name="changes-since-approval"
                value="no"
                checked={disclosureAnswer === 'no'}
                onChange={() => onDisclosureAnswerChange('no')}
                disabled={hasPartyDisclosures}
                className="mt-0.5 h-4 w-4 accent-sp-brand"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-950">
                  No, nothing else changed
                </span>
                <span className="mt-0.5 block text-xs text-gray-600">
                  Continue with the Limited DDA addition only.
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                disclosureAnswer === 'yes'
                  ? 'border-sp-brand bg-sp-accent'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="radio"
                name="changes-since-approval"
                value="yes"
                checked={disclosureAnswer === 'yes'}
                onChange={() => onDisclosureAnswerChange('yes')}
                className="mt-0.5 h-4 w-4 accent-sp-brand"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-950">
                  Yes, I have changes to disclose
                </span>
                <span className="mt-0.5 block text-xs text-gray-600">
                  Review and update the organization and related parties below.
                </span>
              </span>
            </label>
          </div>
          {!limitedDdaRequested ? (
            <p className="mt-3 text-xs text-gray-500">
              Request the Limited DDA sub-product before answering.
            </p>
          ) : null}
          {hasPartyDisclosures ? (
            <p className="mt-3 text-xs text-amber-800">
              Party changes are already disclosed in this request, so the No
              option is unavailable.
            </p>
          ) : null}
        </fieldset>
      </section>

      <section aria-labelledby="organization-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="organization-heading"
            className="text-sm font-semibold text-gray-950"
          >
            Organization
          </h2>
          <span className="text-xs text-gray-500">
            {disclosureAnswer === 'yes'
              ? 'Disclose applicable changes'
              : 'Approved client'}
          </span>
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
          {disclosureAnswer === 'yes' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddParty}
              disabled={isOperating || examplePartyAdded}
            >
              <UserPlus />
              {examplePartyAdded ? 'Party added' : 'Add party'}
            </Button>
          ) : (
            <span className="text-xs text-gray-500">Approved parties</span>
          )}
        </div>
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {people.map(renderParty)}
        </div>
      </section>

      <Dialog
        open={partyToRemove !== undefined}
        onOpenChange={(open) => {
          if (!open && !isOperating) setPartyToRemove(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {partyName(partyToRemove ?? {})}?</DialogTitle>
            <DialogDescription>
              This sends a sparse party update with active set to false. The
              approved party remains visible until the maintenance request is
              approved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPartyToRemove(undefined)}
              disabled={isOperating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isOperating || !partyToRemove?.id}
              onClick={async () => {
                if (!partyToRemove?.id) return;
                await onRemoveParty(partyToRemove.id);
                setPartyToRemove(undefined);
              }}
            >
              {isOperating ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Confirm removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
