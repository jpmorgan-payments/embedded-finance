import {
  CalendarClock,
  FileText,
  LockKeyhole,
  MessageSquareText,
  UserPlus,
} from 'lucide-react';

import type {
  DocumentRequestResponse,
  PartyResponse,
  QuestionResponse,
} from '@/components/client-maintenance/models/maintenance-api';
import { getMaintenancePartyName } from '@/components/client-maintenance/utils/maintenance-party-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

function formatDocumentType(documentType: string): string {
  return documentType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getQuestionLabel(question: QuestionResponse): string {
  const localizedContent = question.content?.find(
    (content) => content.locale === question.defaultLocale
  );
  return (
    localizedContent?.label ??
    question.content?.[0]?.label ??
    question.description ??
    'Additional client information requested'
  );
}

function getQuestionContext(question: QuestionResponse): string {
  return question.description ?? 'Additional client information';
}

function getPartyName(
  documentRequest: DocumentRequestResponse,
  parties: PartyResponse[]
): string {
  const party = parties.find(
    (candidate) => candidate.id === documentRequest.partyId
  );
  return party ? getMaintenancePartyName(party) : 'Related party';
}

export function InformationRequiredPanel({
  questions,
  documentRequests,
  parties,
  newPartyIds,
  isLoading,
  error,
}: {
  questions: QuestionResponse[];
  documentRequests: DocumentRequestResponse[];
  parties: PartyResponse[];
  newPartyIds: string[];
  isLoading: boolean;
  error?: string;
}) {
  const newParties = parties.filter(
    (party) => party.id && newPartyIds.includes(party.id)
  );
  const newPartyNames = newParties.map(getMaintenancePartyName).join(', ');

  return (
    <section
      aria-labelledby="information-required-heading"
      className="border-l-4 border-amber-500 bg-white"
    >
      <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-amber-800">
              Returned by J.P. Morgan
            </p>
            <h2
              id="information-required-heading"
              className="mt-1 text-xl font-semibold text-gray-950"
            >
              More information required
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
              The submitted maintenance request is locked while these new
              outstanding items are resolved. Respond within 30 days to avoid
              automatic termination.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-900"
          >
            Information requested
          </Badge>
        </div>
      </div>

      {newParties.length > 0 ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-amber-800">
                <UserPlus className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-amber-800">
                  New-party due diligence
                </p>
                <h3 className="mt-1 font-semibold text-gray-950">
                  {newPartyNames}
                </h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-700">
                  Existing parties remain approved. The new party is not
                  approved while these requirements are outstanding. Document
                  requests can identify the party; questions remain client-level
                  when the API response has no party ID.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="w-fit border-amber-300 bg-white text-amber-900"
            >
              New party · information requested
            </Badge>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="p-5 sm:p-6">
          <Alert variant="destructive">
            <AlertTitle>Could not load outstanding item details</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isLoading ? (
        <div role="status" className="px-5 py-8 text-sm text-gray-600 sm:px-6">
          Loading returned requirements
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="divide-y divide-gray-200">
          {questions.map((question) => (
            <article
              key={question.id}
              className="grid gap-4 px-5 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:px-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-cyan-800">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-950">
                    {getQuestionContext(question)} question
                  </h3>
                  <Badge variant="outline">Client level</Badge>
                  <Badge variant="outline">Display only</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-800">
                  {getQuestionLabel(question)}
                </p>
                <p className="mt-1 font-mono text-xs text-gray-500">
                  Question {question.id} · No party ID in response
                </p>
              </div>
              <LockKeyhole className="h-4 w-4 text-gray-500" />
            </article>
          ))}

          {documentRequests.map((documentRequest) => (
            <article
              key={documentRequest.id}
              className="grid gap-4 px-5 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:px-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-800">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-950">
                    Document request for{' '}
                    {getPartyName(documentRequest, parties)}
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-900"
                  >
                    Party linked
                  </Badge>
                  <Badge variant="outline">Display only</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-800">
                  {documentRequest.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {documentRequest.outstanding?.documentTypes.map(
                    (documentType) => (
                      <Badge key={documentType} variant="secondary">
                        {formatDocumentType(documentType)}
                      </Badge>
                    )
                  )}
                </div>
                <p className="mt-3 font-mono text-xs text-gray-500">
                  Document request {documentRequest.id} · Party{' '}
                  {documentRequest.partyId}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-900">
                <CalendarClock className="h-4 w-4" />
                30 days
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
