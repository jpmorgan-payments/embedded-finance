import React, { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { AlertCircle, Upload, User } from 'lucide-react';

import {
  ClientResponse,
  ClientStatus,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { DocumentUploadModal } from './DocumentUploadModal';

interface IndividualPartyCardsProps {
  clientData: ClientResponse;
}

interface DetailItemProps {
  label: string;
  value: string | undefined;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  if (!value) return null;

  return (
    <div className="eb-mb-2">
      <div className="eb-text-xs eb-font-medium eb-text-gray-500">{label}</div>
      <div className="eb-text-sm eb-text-gray-700">{value}</div>
    </div>
  );
};

export const IndividualPartyCards: React.FC<IndividualPartyCardsProps> = ({
  clientData,
}) => {
  const { t } = useTranslation(['onboarding', 'common']);
  const [uploadModalState, setUploadModalState] = useState<{
    isOpen: boolean;
    partyId?: string;
    partyName?: string;
  }>({
    isOpen: false,
    partyId: undefined,
    partyName: undefined,
  });

  // Filter to only include individual parties
  const individualParties =
    clientData.parties?.filter((party) => party?.partyType === 'INDIVIDUAL') ||
    [];

  if (individualParties.length === 0) {
    return null;
  }

  // Create document requests structure
  const documentRequests = {
    client: clientData.outstanding?.documentRequestIds || [],
    parties:
      clientData.parties?.map((party) => ({
        partyId: party?.id || '',
        documentIds:
          party?.validationResponse
            ?.flatMap((v) => v?.documentRequestIds || [])
            ?.filter((id) => id?.length > 0) || [],
      })) || [],
  };

  // Check if a party has missing documents
  const hasPartyMissingDocs = (partyId: string) => {
    const partyDocs = documentRequests.parties.find(
      (party) => party.partyId === partyId
    );
    return (partyDocs?.documentIds?.length || 0) > 0;
  };

  // Check if client status is INFORMATION_REQUESTED
  const isInformationRequested =
    clientData.status === ClientStatus.INFORMATION_REQUESTED;

  // Determine default accordion value based on client status
  const defaultAccordionValue = isInformationRequested ? 'details' : undefined;

  const handleOpenUploadModal = (
    partyId: string,
    firstName?: string,
    lastName?: string
  ) => {
    setUploadModalState({
      isOpen: true,
      partyId,
      partyName: `${firstName || ''} ${lastName || ''}`.trim(),
    });
  };

  const handleCloseUploadModal = () => {
    setUploadModalState({
      isOpen: false,
      partyId: undefined,
      partyName: undefined,
    });
  };

  // Format address for display
  const formatAddress = (party: PartyResponse) => {
    const address = party?.individualDetails?.addresses?.[0];
    if (!address) return undefined;

    const addressLines = address.addressLines?.join(', ') || '';
    const city = address.city || '';
    const state = address.state || '';
    const postalCode = address.postalCode || '';
    const country = address.country || '';

    return `${addressLines}, ${city}, ${state} ${postalCode}, ${country}`;
  };

  return (
    <div className="eb-mb-6">
      <h3 className="eb-mb-4 eb-text-lg eb-font-semibold eb-text-gray-800">
        {t('clientOnboardingStatus.individualParties', 'Individual Parties')}
      </h3>

      <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
        {individualParties.map((party) => {
          const hasMissingDocs = party.id
            ? hasPartyMissingDocs(party.id)
            : false;

          // Show CTA only if there are missing documents and status is INFORMATION_REQUESTED
          const showUploadCTA =
            hasMissingDocs && isInformationRequested && party.id;

          return (
            <Card
              key={party.id}
              className="eb-overflow-hidden eb-shadow-sm eb-transition-all eb-duration-200 hover:eb-shadow-md"
            >
              <Accordion
                type="single"
                collapsible
                className="eb-w-full"
                defaultValue={defaultAccordionValue}
              >
                <AccordionItem value="details" className="eb-border-none">
                  <AccordionTrigger className="eb-bg-gray-50 eb-px-4 eb-py-3 hover:eb-bg-gray-100 hover:eb-no-underline">
                    <div className="eb-flex eb-items-center eb-gap-3 eb-text-left">
                      <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-blue-100 eb-text-blue-700">
                        <User className="eb-h-4 eb-w-4" />
                      </div>
                      <div className="eb-flex-1">
                        <div className="eb-flex eb-items-center eb-gap-2">
                          <div className="eb-font-medium eb-text-gray-800">
                            {party.individualDetails?.firstName}{' '}
                            {party.individualDetails?.lastName}
                          </div>
                          {hasMissingDocs && isInformationRequested && (
                            <div className="eb-flex eb-items-center eb-text-amber-600">
                              <AlertCircle className="eb-h-4 eb-w-4" />
                            </div>
                          )}
                        </div>
                        <div className="eb-mt-1 eb-flex eb-flex-wrap eb-gap-1">
                          {party.roles?.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className="eb-bg-gray-50 eb-text-xs eb-font-normal"
                            >
                              {t(`partyRoles.${role}`, role)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="eb-px-4 eb-py-3">
                    <div className="eb-space-y-3">
                      {hasMissingDocs && isInformationRequested && (
                        <div className="eb-mb-3 eb-rounded-md eb-bg-amber-50 eb-p-3 eb-text-sm eb-text-amber-800">
                          <div className="eb-flex eb-items-center eb-gap-2">
                            <AlertCircle className="eb-h-4 eb-w-4" />
                            <span className="eb-font-medium">
                              {t(
                                'clientOnboardingStatus.missingDocuments',
                                'Missing required documents'
                              )}
                            </span>
                          </div>
                          <p className="eb-mt-1 eb-text-xs">
                            {t(
                              'clientOnboardingStatus.missingDocumentsDescription',
                              'Please provide the requested documents to continue with the onboarding process.'
                            )}
                          </p>
                          {showUploadCTA && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="eb-mt-2 eb-border-amber-300 eb-bg-white eb-text-amber-700 hover:eb-bg-amber-50"
                              onClick={() =>
                                handleOpenUploadModal(
                                  party.id || '',
                                  party.individualDetails?.firstName,
                                  party.individualDetails?.lastName
                                )
                              }
                            >
                              <Upload className="eb-mr-2 eb-h-4 eb-w-4" />
                              {t(
                                'clientOnboardingStatus.uploadDocuments',
                                'Upload Documents'
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {hasMissingDocs && !isInformationRequested && (
                        <div className="eb-mb-3 eb-rounded-md eb-bg-gray-50 eb-p-3 eb-text-sm eb-text-gray-700">
                          <div className="eb-flex eb-items-center eb-gap-2">
                            <AlertCircle className="eb-h-4 eb-w-4" />
                            <span className="eb-font-medium">
                              {t(
                                'clientOnboardingStatus.pendingDocuments',
                                'Document verification in progress'
                              )}
                            </span>
                          </div>
                          <p className="eb-mt-1 eb-text-xs">
                            {t(
                              'clientOnboardingStatus.pendingDocumentsDescription',
                              'Your documents are being reviewed. You will be notified if additional information is needed.'
                            )}
                          </p>
                        </div>
                      )}

                      <DetailItem
                        label={t(
                          'clientOnboardingStatus.labels.email',
                          'Email'
                        )}
                        value={party.email}
                      />
                      <DetailItem
                        label={t(
                          'clientOnboardingStatus.labels.address',
                          'Address'
                        )}
                        value={formatAddress(party)}
                      />
                      <DetailItem
                        label={t(
                          'clientOnboardingStatus.labels.jobTitle',
                          'Job Title'
                        )}
                        value={party.individualDetails?.jobTitle}
                      />
                      {party.individualDetails?.phone && (
                        <DetailItem
                          label={t(
                            'clientOnboardingStatus.labels.phone',
                            'Phone'
                          )}
                          value={party.individualDetails.phone.phoneNumber}
                        />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })}
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalState.isOpen}
        onClose={handleCloseUploadModal}
        partyId={uploadModalState.partyId}
        title={
          uploadModalState.partyName
            ? `Upload Documents for ${uploadModalState.partyName}`
            : 'Upload Documents'
        }
      />
    </div>
  );
};
