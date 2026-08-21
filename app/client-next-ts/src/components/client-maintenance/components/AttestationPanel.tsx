import { useState, type FormEvent } from 'react';
import { FileCheck2, Loader2, Send } from 'lucide-react';

import type { AttestationInput } from '@/components/client-maintenance/client-maintenance-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AttestationPanel({
  organizationName,
  documentId,
  isSubmitting,
  error,
  onSubmit,
}: {
  organizationName: string;
  documentId: string;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (attestation: AttestationInput) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState('Jordan');
  const [lastName, setLastName] = useState('Lee');
  const [designation, setDesignation] = useState('Chief executive officer');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agreed) return;
    await onSubmit({
      attester: { firstName, lastName, designation },
      attestationTime: new Date().toISOString(),
      documentId,
      ipAddress: '192.0.2.10',
    });
  };

  return (
    <section aria-labelledby="attestation-heading" className="space-y-5">
      <div>
        <h2
          id="attestation-heading"
          className="text-xl font-semibold text-gray-950"
        >
          Confirm and attest
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          The attester must be authorized to confirm these business and party
          details.
        </p>
      </div>

      <div className="rounded-md border border-gray-200 bg-white">
        <div className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 p-4">
          <FileCheck2 className="mt-0.5 h-5 w-5 text-sp-brand" />
          <div>
            <h3 className="font-semibold text-gray-950">
              Maintenance consent and certification
            </h3>
            <p className="mt-1 break-all font-mono text-[11px] text-gray-500">
              Document {documentId}
            </p>
          </div>
        </div>
        <div className="p-4 text-sm leading-6 text-gray-700">
          I certify that I have reviewed the proposed updates, that the
          information is complete and accurate, and that I am authorized to
          submit it for due diligence review.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-md border border-gray-200 bg-white p-4 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="attester-first-name">First name</Label>
            <Input
              id="attester-first-name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="attester-last-name">Last name</Label>
            <Input
              id="attester-last-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="attester-designation">Designation</Label>
            <Input
              id="attester-designation"
              required
              value={designation}
              onChange={(event) => setDesignation(event.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-4 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sp-brand focus:ring-sp-brand"
          />
          <span>
            I have read the certification and agree on behalf of{' '}
            {organizationName}.
          </span>
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={!agreed || isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            Attest and submit for verification
          </Button>
        </div>
      </form>
    </section>
  );
}
