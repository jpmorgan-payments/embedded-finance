import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const outstanding = clientData?.outstanding;
  const questionIds = outstanding?.questionIds;

  const { data: questionsDetails } = useSmbdoListQuestions(
    questionIds?.length
      ? {
          questionIds: questionIds.join(','),
        }
      : undefined
  );

  return (
    <Alert
      variant="default"
      className="eb-mb-4 eb-w-full eb-border-yellow-100 eb-bg-yellow-50"
    >
      <div className="eb-flex eb-gap-3">
        <AlertTriangle className="eb-h-5 eb-w-5 eb-text-yellow-500" />
        <div className="eb-flex eb-flex-col">
          <AlertTitle className="eb-font-semibold eb-text-yellow-800">
            {t('onboarding:outstandingKYC.title')}
          </AlertTitle>
          <AlertDescription className="eb-text-yellow-800">
            <p>{t('onboarding:outstandingKYC.description')}</p>

            {!!outstanding?.attestationDocumentIds?.length &&
              !!isAttestationInfoIncluded && (
                <div className="eb-mt-2">
                  <h4 className="eb-font-semibold">
                    {t('onboarding:outstandingKYC.sections.attestations')}
                  </h4>
                  <ul className="eb-list-inside eb-list-disc">
                    {outstanding.attestationDocumentIds.map((id) => (
                      <li key={id}>
                        {t('onboarding:outstandingKYC.attestationId')}: {id}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {!!outstanding?.documentRequestIds?.length && (
              <div className="eb-mt-2">
                <h4 className="eb-font-semibold">
                  {t('onboarding:outstandingKYC.sections.documents')}
                </h4>
                <ul className="eb-list-inside eb-list-disc">
                  {outstanding.documentRequestIds.map((id) => (
                    <li key={id}>
                      {t('onboarding:outstandingKYC.documentId')}: {id}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!outstanding?.questionIds?.length && (
              <div className="eb-mt-2">
                <h4 className="eb-font-semibold">
                  {t('onboarding:outstandingKYC.sections.questions')}
                </h4>
                <ul className="eb-list-inside eb-list-disc">
                  {outstanding.questionIds.map((id) => {
                    const question = questionsDetails?.questions?.find(
                      (q) => q.id === id
                    );
                    return (
                      <li key={id}>
                        {question?.description || `Loading question ${id}...`}
                      </li>
                    );
                  })}
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
                <h4 className="eb-font-semibold">
                  {t('onboarding:outstandingKYC.sections.parties')}
                </h4>
                <ul className="eb-list-inside eb-list-disc">
                  {outstanding.partyRoles.map((role) => (
                    <li key={role}>
                      {t('onboarding:outstandingKYC.partyRole')}: {role}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default OutstandingKYCRequirements;
