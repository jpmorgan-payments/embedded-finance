import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { MAINTENANCE_ATTESTATION_DOCUMENT_ID } from '@/components/client-maintenance/mocks/client-maintenance-mock-data';
import type {
  MaintenancePartyUpdate,
  PartyResponse,
} from '@/components/client-maintenance/models/maintenance-api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ApiSequence } from './components/ApiSequence';
import {
  AttestationPanel,
  createDefaultAttestation,
} from './components/AttestationPanel';
import { DemoLifecyclePanel } from './components/DemoLifecyclePanel';
import { GuidedDemoNavigation } from './components/GuidedDemoNavigation';
import { InformationRequiredPanel } from './components/InformationRequiredPanel';
import {
  MaintenanceProgress,
  type MaintenanceStep,
} from './components/MaintenanceProgress';
import { MaintenanceReviewOptions } from './components/MaintenanceReviewOptions';
import { PartyEditDrawer } from './components/PartyEditDrawer';
import { ProfileOverview } from './components/ProfileOverview';
import { useClientMaintenanceWorkspace } from './hooks/use-client-maintenance-workspace';

function LoadingState() {
  return (
    <div
      role="status"
      className="mx-auto flex min-h-[28rem] max-w-7xl items-center justify-center px-4"
    >
      <div className="text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-sp-brand" />
        <p className="mt-3 text-sm font-medium text-gray-700">
          Loading approved profile
        </p>
      </div>
    </div>
  );
}

export function ClientMaintenanceWorkspace() {
  const workspace = useClientMaintenanceWorkspace();
  const [step, setStep] = useState<MaintenanceStep>('profile');
  const [editingParty, setEditingParty] = useState<PartyResponse>();
  const [disclosureAnswer, setDisclosureAnswer] = useState<'yes' | 'no'>();
  const projection = workspace.projection;
  const queryError =
    workspace.clientQuery.error ?? workspace.maintenanceQuery.error;
  const acceptedAt = workspace.submitForVerification.data?.acceptedAt;
  const isInformationRequested =
    projection !== undefined &&
    (projection.approvedClient.status === 'INFORMATION_REQUESTED' ||
      projection.activeProposals.some(
        (party) => party.updateRequest?.status === 'INFORMATION_REQUESTED'
      ) ||
      projection.productChanges.some(
        (change) => change.source.status === 'INFORMATION_REQUESTED'
      ));
  const isComplete =
    step === 'submitted' &&
    projection?.partyChanges.length === 0 &&
    projection.productChanges.length === 0 &&
    projection.historicalProposals.length > 0;
  const progressStep: MaintenanceStep = isInformationRequested
    ? 'information'
    : step;

  if (workspace.clientQuery.isLoading || workspace.maintenanceQuery.isLoading) {
    return <LoadingState />;
  }

  if (!projection || queryError) {
    return (
      <div className="mx-auto min-h-[28rem] max-w-3xl px-4 py-16">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Could not load the maintenance workspace</AlertTitle>
          <AlertDescription>
            <p>
              {queryError?.message ?? 'The profile response was incomplete.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={workspace.refreshWorkspace}
            >
              <RefreshCw />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const saveParty = async (update: MaintenancePartyUpdate) => {
    if (!editingParty?.id) return;
    await workspace.updateParty.mutateAsync({
      partyId: editingParty.id,
      update,
    });
    setEditingParty(undefined);
    setStep('review');
  };

  const resetDemo = async () => {
    await workspace.reset.mutateAsync();
    setEditingParty(undefined);
    setDisclosureAnswer(undefined);
    setStep('profile');
  };

  const changeCount =
    projection.productChanges.length +
    projection.partyChanges.reduce(
      (total, party) => total + Math.max(1, party.fieldChanges.length),
      0
    );
  const isOperating =
    workspace.requestProduct.isPending ||
    workspace.addParty.isPending ||
    workspace.removeParty.isPending ||
    workspace.loadCompleteStory.isPending;
  const operationError =
    workspace.requestProduct.error?.message ??
    workspace.addParty.error?.message ??
    workspace.removeParty.error?.message ??
    workspace.loadCompleteStory.error?.message;
  const organizationName =
    projection.approvedClient.parties.find(
      (party) =>
        party.partyType === 'ORGANIZATION' && party.roles?.includes('CLIENT')
    )?.organizationDetails?.organizationName ?? 'Approved client';

  const runGuidedAction = async () => {
    if (isComplete) {
      setStep('profile');
      return;
    }
    if (isInformationRequested) {
      document
        .getElementById('information-required-heading')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (step === 'submitted') {
      await workspace.requestInformation.mutateAsync();
      return;
    }
    if (step === 'attest') {
      const documentId =
        projection.approvedClient.outstanding.attestationDocumentIds[0] ??
        MAINTENANCE_ATTESTATION_DOCUMENT_ID;
      await workspace.submitForVerification.mutateAsync(
        createDefaultAttestation(documentId)
      );
      setStep('submitted');
      return;
    }
    if (step === 'review') {
      setStep('attest');
      return;
    }
    if (changeCount > 0) {
      setStep('review');
      return;
    }
    setDisclosureAnswer('yes');
    await workspace.loadCompleteStory.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-sp-bg text-gray-950">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase text-sp-brand">
                  Approved client maintenance
                </p>
                <Badge
                  variant="outline"
                  className="border-cyan-200 bg-cyan-50 text-cyan-800"
                >
                  Illustrative option
                </Badge>
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-gray-950 sm:text-3xl">
                {organizationName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Add the Limited DDA sub-product, disclose anything that changed
                since the previous approval, and coordinate the separate product
                and party requests.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-800"
              >
                Approved client
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-900"
              >
                {changeCount} proposed{' '}
                {changeCount === 1 ? 'change' : 'changes'}
              </Badge>
            </div>
          </div>
          <div className="mt-7">
            <MaintenanceProgress currentStep={progressStep} />
          </div>
          <GuidedDemoNavigation
            step={step}
            hasChanges={changeCount > 0}
            isInformationRequested={isInformationRequested}
            isComplete={isComplete}
            isPending={
              workspace.loadCompleteStory.isPending ||
              workspace.requestInformation.isPending ||
              workspace.submitForVerification.isPending
            }
            onAction={() => void runGuidedAction()}
          />
        </div>
      </header>

      <ApiSequence currentStep={progressStep} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-8">
        <main className="min-w-0">
          {projection.unresolvedProposals.length > 0 ? (
            <Alert className="mb-6 border-red-200 bg-red-50 text-red-900">
              <AlertTriangle />
              <AlertTitle>
                Some proposals cannot be matched to a party
              </AlertTitle>
              <AlertDescription>
                The preview excludes {projection.unresolvedProposals.length}{' '}
                incomplete maintenance payloads.
              </AlertDescription>
            </Alert>
          ) : null}

          {step === 'profile' ? (
            <ProfileOverview
              projection={projection}
              onEditParty={setEditingParty}
              onReview={() => setStep('review')}
              onRequestProduct={() => workspace.requestProduct.mutate()}
              onAddParty={() =>
                workspace.addParty.mutate(projection.approvedClient.partyId)
              }
              onRemoveParty={async (partyId) => {
                await workspace.removeParty.mutateAsync(partyId);
              }}
              disclosureAnswer={disclosureAnswer}
              onDisclosureAnswerChange={setDisclosureAnswer}
              onLoadCompleteStory={() => {
                setDisclosureAnswer('yes');
                workspace.loadCompleteStory.mutate();
              }}
              isOperating={isOperating}
              operationError={operationError}
            />
          ) : null}

          {step === 'review' ? (
            <div className="space-y-6">
              <MaintenanceReviewOptions
                projection={projection}
                onEditParty={setEditingParty}
              />
              <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('profile')}
                >
                  <ArrowLeft />
                  Back to profile
                </Button>
                <Button type="button" onClick={() => setStep('attest')}>
                  Continue to attestation
                  <ArrowRight />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'attest' ? (
            <div className="space-y-6">
              <AttestationPanel
                organizationName={organizationName}
                documentId={
                  projection.approvedClient.outstanding
                    .attestationDocumentIds[0] ??
                  MAINTENANCE_ATTESTATION_DOCUMENT_ID
                }
                isSubmitting={workspace.submitForVerification.isPending}
                error={workspace.submitForVerification.error?.message}
                onSubmit={async (attestation) => {
                  await workspace.submitForVerification.mutateAsync(
                    attestation
                  );
                  setStep('submitted');
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('review')}
              >
                <ArrowLeft />
                Back to review
              </Button>
            </div>
          ) : null}

          {step === 'submitted' ? (
            <div className="space-y-6">
              <section
                aria-labelledby="submitted-heading"
                className={`rounded-md border p-6 sm:p-8 ${
                  isComplete
                    ? 'border-emerald-300 bg-emerald-50'
                    : isInformationRequested
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-cyan-200 bg-cyan-50'
                }`}
              >
                {isInformationRequested ? (
                  <AlertTriangle className="h-8 w-8 text-amber-700" />
                ) : (
                  <CheckCircle2
                    className={`h-8 w-8 ${isComplete ? 'text-emerald-700' : 'text-cyan-700'}`}
                  />
                )}
                <h2
                  id="submitted-heading"
                  className="mt-4 text-xl font-semibold text-gray-950"
                >
                  {isComplete
                    ? 'Maintenance approved'
                    : isInformationRequested
                      ? 'Maintenance returned for information'
                      : 'Submitted for review'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                  {isComplete
                    ? 'The approved client profile now includes the accepted changes. Approved maintenance requests no longer contribute to the proposed snapshot. In production, approved values may take 24-48 hours to appear in client GET responses.'
                    : isInformationRequested
                      ? 'J.P. Morgan needs additional information before review can continue. The submitted changes remain read-only.'
                      : 'J.P. Morgan accepted the verification request. This does not mean the maintenance changes are approved; use the demo controls to simulate later status updates.'}
                </p>
                {acceptedAt ? (
                  <p className="mt-4 font-mono text-xs text-gray-600">
                    202 Accepted · {new Date(acceptedAt).toLocaleString()}
                  </p>
                ) : null}
                {!isComplete && !isInformationRequested && acceptedAt ? (
                  <div className="mt-5 flex flex-col gap-3 border-t border-cyan-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-950">
                        Next in the default scenario
                      </p>
                      <p className="mt-1 text-sm leading-6 text-gray-700">
                        Simulate the later review response that requests
                        additional questions and a document for the new party.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full shrink-0 sm:w-auto"
                      disabled={workspace.requestInformation.isPending}
                      onClick={() => workspace.requestInformation.mutate()}
                    >
                      {workspace.requestInformation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : null}
                      Continue to questions and documents
                      {!workspace.requestInformation.isPending ? (
                        <ArrowRight />
                      ) : null}
                    </Button>
                  </div>
                ) : null}
                {isComplete ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 bg-white"
                    onClick={() => setStep('profile')}
                  >
                    View approved profile
                  </Button>
                ) : null}
              </section>

              {isInformationRequested ? (
                <InformationRequiredPanel
                  questions={workspace.questionsQuery.data?.questions ?? []}
                  documentRequests={workspace.documentRequestsQuery.data ?? []}
                  parties={projection.proposedClient.parties}
                  newPartyIds={projection.partyChanges.flatMap((change) =>
                    change.action === 'ADD' ? [change.partyId] : []
                  )}
                  isLoading={
                    workspace.questionsQuery.isLoading ||
                    workspace.documentRequestsQuery.isLoading
                  }
                  error={
                    workspace.questionsQuery.error?.message ??
                    workspace.documentRequestsQuery.error?.message
                  }
                />
              ) : null}
            </div>
          ) : null}
        </main>

        <div className="space-y-4">
          <DemoLifecyclePanel
            projection={projection}
            acceptedAt={acceptedAt}
            isApproving={workspace.approve.isPending}
            isRequestingInformation={workspace.requestInformation.isPending}
            isResetting={workspace.reset.isPending}
            onApprove={() => workspace.approve.mutate()}
            onRequestInformation={() => workspace.requestInformation.mutate()}
            onReset={resetDemo}
          />
          <div className="rounded-md border border-gray-200 bg-white p-4 text-xs leading-5 text-gray-600">
            <strong className="block text-gray-900">Preview policy</strong>
            Product and party maintenance use separate request lifecycles. Party
            draft edits share one party request ID; approved, declined, and
            terminated requests are excluded from the proposed profile.
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {workspace.approve.isSuccess
          ? 'Maintenance approved and profile refreshed.'
          : ''}
      </div>

      {editingParty ? (
        <PartyEditDrawer
          party={editingParty}
          isSaving={workspace.updateParty.isPending}
          error={workspace.updateParty.error?.message}
          onClose={() => setEditingParty(undefined)}
          onSave={saveParty}
        />
      ) : null}
    </div>
  );
}
