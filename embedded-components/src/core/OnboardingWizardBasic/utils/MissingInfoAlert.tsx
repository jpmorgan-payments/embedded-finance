import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from 'react';
import { ChevronDown, X } from 'lucide-react';

import { _get, isValueEmpty } from '@/lib/utils';
import { useSmbdoListQuestions } from '@/api/generated/smbdo';
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
  individualFields,
  organizationFields,
} from '../ReviewAndAttestStepForm/partyFields';

const renderParty = (
  party: PartyResponse,
  fields: { label: any; path: any; transformFunc?: any }[]
) => (
  <div
    key={(party?.id ?? '') + (party?.partyType ?? '')}
    className="eb-mb-4 eb-p-4"
  >
    <div className="eb-mb-2 eb-font-medium">{party?.partyType}</div>
    <dl className="eb-ml-2 eb-space-y-2">
      {fields.map(({ label, path, transformFunc }) => {
        const value = _get(party, path);
        if (!isValueEmpty(value)) {
          return (
            <div
              key={path}
              className="eb-flex eb-flex-col eb-border-b eb-border-dotted eb-border-gray-300 sm:eb-flex-row sm:eb-justify-between"
            >
              <dt className="eb-w-full eb-font-medium sm:eb-w-1/3">{label}:</dt>
              <dd className="eb-w-full eb-break-words sm:eb-w-2/3 sm:eb-pl-4">
                {transformFunc
                  ? transformFunc(value)
                  : typeof value === 'boolean'
                    ? value.toString()
                    : Array.isArray(value)
                      ? value.join(', ')
                      : value}
              </dd>
            </div>
          );
        }
        return null;
      })}
    </dl>
  </div>
);

export const MissingInfoAlert = ({
  clientData,
}: {
  clientData: ClientResponse;
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: questionsDetails } = useSmbdoListQuestions({
    questionIds: clientData?.questionResponses
      ?.map((r) => r.questionId)
      .join(','),
  });

  const getMissingFields = () => {
    const missing: string[] = [];

    // Check attestations
    if (
      clientData?.outstanding?.attestationDocumentIds &&
      clientData.outstanding.attestationDocumentIds.length > 0
    ) {
      missing.push(
        `Missing attestation documents (${clientData.outstanding.attestationDocumentIds.length})`
      );
    }

    // Check party roles
    if (
      clientData?.outstanding?.partyRoles &&
      clientData.outstanding.partyRoles.length > 0
    ) {
      missing.push(
        `Missing parties with roles: ${clientData.outstanding.partyRoles.join(', ')}`
      );
    }

    // Check questions
    if (
      clientData?.outstanding?.questionIds &&
      clientData.outstanding.questionIds.length > 0
    ) {
      missing.push(
        `Missing answers for ${clientData.outstanding.questionIds.length} questions`
      );
    }

    return missing;
  };

  const getPartyMissingFields = (party: any) => {
    if (!party.validationResponse) return null;

    const missingFields = party.validationResponse.flatMap(
      (validation: { fields: any[] }) =>
        validation.fields?.map((field) => field.name) ?? []
    );

    return missingFields.length > 0 ? missingFields : null;
  };

  const missingFields = getMissingFields();
  const hasAnyMissingInfo =
    missingFields.length > 0 ||
    (clientData?.parties &&
      clientData.parties.some((party) => {
        const fields = getPartyMissingFields(party);
        return fields && fields.length > 0;
      }));

  if (!hasAnyMissingInfo || isDismissed) return null;

  return (
    <div className="eb-relative eb-mb-4 eb-rounded-md eb-border eb-border-blue-200 eb-bg-blue-50 eb-p-3 eb-text-sm eb-text-blue-900">
      <Button
        onClick={() => setIsDismissed(true)}
        variant="ghost"
        size="icon"
        className="eb-absolute eb-right-2 eb-top-2 eb-h-6 eb-w-6 eb-p-0"
        aria-label="Dismiss alert"
      >
        <X className="eb-h-4 eb-w-4" />
      </Button>
      <div className="eb-mb-2 eb-font-medium">Missing Information:</div>
      <div className="eb-ml-2 eb-space-y-2">
        {missingFields.length > 0 && (
          <div className="eb-flex eb-flex-wrap eb-gap-2">
            {missingFields.map((field, index) => (
              <span
                key={index}
                className="eb-rounded-full eb-bg-blue-100 eb-px-2 eb-py-1 eb-text-xs eb-font-medium eb-text-blue-800"
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {clientData?.parties?.map((party) => {
          const partyMissingFields = getPartyMissingFields(party);
          if (!partyMissingFields) return null;

          return (
            <div key={party.id}>
              <div className="eb-mb-1 eb-text-xs eb-font-medium">
                {party.partyType} ({party.id}):
              </div>
              <div className="eb-flex eb-flex-wrap eb-gap-2">
                {partyMissingFields.map(
                  (
                    field:
                      | string
                      | number
                      | boolean
                      | ReactElement<any, string | JSXElementConstructor<any>>
                      | Iterable<ReactNode>
                      | ReactPortal
                      | Iterable<ReactNode>
                      | null
                      | undefined,
                    index: Key | null | undefined
                  ) => (
                    <span
                      key={index}
                      className="eb-rounded-full eb-bg-blue-100 eb-px-2 eb-py-1 eb-text-xs eb-font-medium eb-text-blue-800"
                    >
                      {field}
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Collapsible>
        <CollapsibleTrigger className="eb-group eb-mb-2 eb-mt-4 eb-flex eb-w-full eb-cursor-pointer eb-items-center eb-justify-between eb-text-left eb-font-medium">
          <div className="eb-flex-1">Client Profile Existing Information:</div>
          <ChevronDown className="eb-group-data-[state=open]:rotate-180 eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-transition-transform" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="eb-ml-2 eb-space-y-2">
            <div className="eb-w-xl eb-px-4">
              {clientData?.parties?.map((party) =>
                party?.partyType === 'ORGANIZATION'
                  ? renderParty(party, organizationFields)
                  : renderParty(party, individualFields)
              )}
            </div>

            {!!clientData?.questionResponses?.length && (
              <div className="eb-w-xl eb-px-4">
                <div className="eb-mb-2 eb-font-medium">
                  Questions Responses
                </div>
                {clientData?.questionResponses?.map((questionResponse) => (
                  <>
                    {!!questionResponse?.values?.length && (
                      <div key={questionResponse.questionId} className="eb-p-4">
                        <dl className="eb-ml-2">
                          <dt className="">
                            {
                              questionsDetails?.questions?.find(
                                (q) => q.id === questionResponse.questionId
                              )?.description
                            }
                          </dt>
                          <dd className="">
                            <b>Response:</b>{' '}
                            {questionResponse?.values?.join(', ')}
                          </dd>
                        </dl>
                      </div>
                    )}
                  </>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
