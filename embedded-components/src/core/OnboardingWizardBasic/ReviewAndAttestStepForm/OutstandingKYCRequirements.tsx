import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { useGetParty, useSmbdoListQuestions } from '@/api/generated/smbdo';
import { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MissingPartyFields = ({ partyId }: { partyId: string }) => {
  const { data: party } = useGetParty(partyId);
  const partyValidationResponseFields = party?.validationResponse?.filter(
    (r) => r.validationStatus === 'NEEDS_INFO'
  )?.[0]?.fields;

  if (!partyValidationResponseFields) {
    return null;
  }

  return (
    <div key={partyId} className="eb-mt-2">
      <h4 className="eb-font-semibold">
        Missing fields for Party ID: {partyId}
      </h4>
      <ul className="eb-list-inside eb-list-disc">
        {partyValidationResponseFields.map((field, index) => (
          <li key={index}>
            {field.name}: {field.type}
          </li>
        ))}
      </ul>
    </div>
  );
};

const OutstandingKYCRequirements = ({
  clientData,
  isAttestationInfoIncluded,
}: {
  clientData: ClientResponse;
  isAttestationInfoIncluded?: boolean;
}) => {
  const outstanding = clientData?.outstanding;

  const { data: questionsDetails } = useSmbdoListQuestions({
    questionIds: clientData?.outstanding?.questionIds?.join(','),
  });

  return (
    <Alert variant="destructive" className="eb-max-w-2xl eb-outline-none">
      <AlertTriangle className="eb-outline-orange eb-h-4 eb-w-4" />
      <AlertTitle>Outstanding KYC Requirements</AlertTitle>
      <AlertDescription>
        <p>Please complete the following before initiating KYC:</p>

        {!!outstanding?.attestationDocumentIds?.length &&
          !!isAttestationInfoIncluded && (
            <div className="eb-mt-2">
              <h4 className="eb-font-semibold">Missing Attestations</h4>
              <ul className="eb-list-inside eb-list-disc">
                {outstanding.attestationDocumentIds.map((id) => (
                  <li key={id}>Attestation Document ID: {id}</li>
                ))}
              </ul>
            </div>
          )}

        {!!outstanding?.documentRequestIds?.length && (
          <div className="eb-mt-2">
            <h4 className="eb-font-semibold">Missing Documents</h4>
            <ul className="eb-list-inside eb-list-disc">
              {outstanding.documentRequestIds.map((id) => (
                <li key={id}>Document Request ID: {id}</li>
              ))}
            </ul>
          </div>
        )}

        {!!outstanding?.questionIds?.length && (
          <div className="eb-mt-2">
            <h4 className="eb-font-semibold">Unanswered Questions</h4>
            <ul className="eb-list-inside eb-list-disc">
              {outstanding.questionIds.map((id) => (
                <li key={id}>
                  Question ({id}):{' '}
                  {
                    questionsDetails?.questions?.find((q) => q.id === id)
                      ?.description
                  }
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!outstanding?.partyIds?.length && (
          <div className="eb-mt-2">
            {outstanding.partyIds.map((partyId) => (
              <MissingPartyFields partyId={partyId} />
            ))}
          </div>
        )}

        {!!outstanding?.partyRoles?.length && (
          <div className="eb-mt-2">
            <h4 className="eb-font-semibold">Missing Parties</h4>
            <ul className="eb-list-inside eb-list-disc">
              {outstanding.partyRoles.map((role) => (
                <li key={role}>Missing party with role: {role}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default OutstandingKYCRequirements;
