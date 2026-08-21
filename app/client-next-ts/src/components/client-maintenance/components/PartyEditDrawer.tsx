import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, Save, X } from 'lucide-react';

import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type EditValues = {
  email: string;
  primaryName: string;
  secondaryName: string;
  jobTitle: string;
  website: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function toEditValues(party: PartyResponse): EditValues {
  const details =
    party.partyType === 'ORGANIZATION'
      ? party.organizationDetails
      : party.individualDetails;
  const address = details?.addresses?.[0];
  return {
    email: party.email ?? '',
    primaryName:
      party.partyType === 'ORGANIZATION'
        ? (party.organizationDetails?.organizationName ?? '')
        : (party.individualDetails?.firstName ?? ''),
    secondaryName:
      party.partyType === 'ORGANIZATION'
        ? (party.organizationDetails?.dbaName ?? '')
        : (party.individualDetails?.lastName ?? ''),
    jobTitle: party.individualDetails?.jobTitle ?? '',
    website: party.organizationDetails?.website ?? '',
    addressLine: address?.addressLines[0] ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postalCode: address?.postalCode ?? '',
    country: address?.country ?? '',
  };
}

function buildSparseUpdate(
  party: PartyResponse,
  original: EditValues,
  current: EditValues
): Partial<PartyResponse> {
  const update: Partial<PartyResponse> = {};
  if (current.email !== original.email) update.email = current.email;

  const addressChanged = (
    ['addressLine', 'city', 'state', 'postalCode', 'country'] as const
  ).some((key) => current[key] !== original[key]);
  const originalAddress =
    party.partyType === 'ORGANIZATION'
      ? party.organizationDetails?.addresses?.[0]
      : party.individualDetails?.addresses?.[0];
  const addresses = addressChanged
    ? [
        {
          addressType:
            originalAddress?.addressType ??
            (party.partyType === 'ORGANIZATION'
              ? 'BUSINESS_ADDRESS'
              : 'RESIDENTIAL_ADDRESS'),
          addressLines: [current.addressLine],
          city: current.city,
          state: current.state || undefined,
          postalCode: current.postalCode,
          country: current.country,
        },
      ]
    : undefined;

  if (party.partyType === 'ORGANIZATION') {
    const organizationDetails: NonNullable<
      PartyResponse['organizationDetails']
    > = {};
    if (current.primaryName !== original.primaryName) {
      organizationDetails.organizationName = current.primaryName;
    }
    if (current.secondaryName !== original.secondaryName) {
      organizationDetails.dbaName = current.secondaryName;
    }
    if (current.website !== original.website) {
      organizationDetails.website = current.website;
    }
    if (addresses) organizationDetails.addresses = addresses;
    if (Object.keys(organizationDetails).length > 0) {
      update.organizationDetails = organizationDetails;
    }
  } else {
    const individualDetails: NonNullable<PartyResponse['individualDetails']> =
      {};
    if (current.primaryName !== original.primaryName) {
      individualDetails.firstName = current.primaryName;
    }
    if (current.secondaryName !== original.secondaryName) {
      individualDetails.lastName = current.secondaryName;
    }
    if (current.jobTitle !== original.jobTitle) {
      individualDetails.jobTitle = current.jobTitle;
    }
    if (addresses) individualDetails.addresses = addresses;
    if (Object.keys(individualDetails).length > 0) {
      update.individualDetails = individualDetails;
    }
  }
  return update;
}

export function PartyEditDrawer({
  party,
  isSaving,
  error,
  onClose,
  onSave,
}: {
  party: PartyResponse;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (update: Partial<PartyResponse>) => Promise<void>;
}) {
  const [values, setValues] = useState(() => toEditValues(party));
  const originalValues = useRef(values);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSaving, onClose]);

  const isOrganization = party.partyType === 'ORGANIZATION';
  const hasChanges =
    JSON.stringify(values) !== JSON.stringify(originalValues.current);

  const updateValue = (key: keyof EditValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const update = buildSparseUpdate(party, originalValues.current, values);
    if (Object.keys(update).length === 0) return;
    await onSave(update);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={isSaving ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="party-edit-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-sp-brand">
              Proposed update
            </p>
            <h2
              id="party-edit-title"
              className="text-base font-semibold text-gray-950"
            >
              Edit {isOrganization ? 'organization' : 'person'}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit drawer"
          >
            <X />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="party-email">Email</Label>
                <Input
                  id="party-email"
                  type="email"
                  required
                  autoFocus
                  value={values.email}
                  onChange={(event) => updateValue('email', event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="party-primary-name">
                  {isOrganization ? 'Legal business name' : 'First name'}
                </Label>
                <Input
                  id="party-primary-name"
                  required
                  value={values.primaryName}
                  onChange={(event) =>
                    updateValue('primaryName', event.target.value)
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="party-secondary-name">
                  {isOrganization ? 'Doing business as' : 'Last name'}
                </Label>
                <Input
                  id="party-secondary-name"
                  required={!isOrganization}
                  value={values.secondaryName}
                  onChange={(event) =>
                    updateValue('secondaryName', event.target.value)
                  }
                  className="mt-1.5"
                />
              </div>
              {isOrganization ? (
                <div className="sm:col-span-2">
                  <Label htmlFor="party-website">Website</Label>
                  <Input
                    id="party-website"
                    type="url"
                    value={values.website}
                    onChange={(event) =>
                      updateValue('website', event.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <Label htmlFor="party-job-title">Job title</Label>
                  <Input
                    id="party-job-title"
                    required
                    value={values.jobTitle}
                    onChange={(event) =>
                      updateValue('jobTitle', event.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-gray-950">
                {isOrganization ? 'Business address' : 'Residential address'}
              </legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="party-address-line">Address line</Label>
                  <Input
                    id="party-address-line"
                    value={values.addressLine}
                    onChange={(event) =>
                      updateValue('addressLine', event.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="party-city">City</Label>
                  <Input
                    id="party-city"
                    value={values.city}
                    onChange={(event) =>
                      updateValue('city', event.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="party-state">State</Label>
                  <Input
                    id="party-state"
                    value={values.state}
                    onChange={(event) =>
                      updateValue('state', event.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="party-postal-code">Postal code</Label>
                  <Input
                    id="party-postal-code"
                    value={values.postalCode}
                    onChange={(event) =>
                      updateValue('postalCode', event.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="party-country">Country</Label>
                  <Input
                    id="party-country"
                    value={values.country}
                    onChange={(event) =>
                      updateValue('country', event.target.value)
                    }
                    className="mt-1.5"
                    maxLength={2}
                  />
                </div>
              </div>
            </fieldset>

            {error ? (
              <p
                role="alert"
                className="rounded-md bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!hasChanges || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save proposed update
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
