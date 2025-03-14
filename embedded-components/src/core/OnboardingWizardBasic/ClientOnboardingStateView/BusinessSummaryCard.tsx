import React, { useState } from 'react';
import { AlertCircle, Building, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ClientResponse, ClientStatus } from '@/api/generated/smbdo.schemas';
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

interface BusinessSummaryCardProps {
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

export const BusinessSummaryCard: React.FC<BusinessSummaryCardProps> = ({
  clientData,
}) => {
  const { t } = useTranslation(['onboarding', 'common']);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Find business details from clientData
  const businessDetails = clientData.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  if (!businessDetails) {
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

  // Check if business has missing documents
  const businessPartyDocs = documentRequests.parties.find(
    (party) => party.partyId === businessDetails.id
  );
  const hasMissingBusinessDocs =
    (businessPartyDocs?.documentIds?.length || 0) > 0 ||
    documentRequests.client.length > 0;

  // Check if client status is INFORMATION_REQUESTED
  const isInformationRequested =
    clientData.status === ClientStatus.INFORMATION_REQUESTED;

  // Check if client status is REVIEW_IN_PROGRESS
  const isReviewInProgress =
    clientData.status === ClientStatus.REVIEW_IN_PROGRESS;

  // Show CTA only if there are missing documents and status is INFORMATION_REQUESTED
  const showUploadCTA = hasMissingBusinessDocs && isInformationRequested;

  // Determine default accordion value based on client status
  const defaultAccordionValue = isInformationRequested ? 'details' : undefined;

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  return (
    <div className="eb-mb-6">
      <h3 className="eb-mb-4 eb-text-lg eb-font-semibold eb-text-gray-800">
        {t('clientOnboardingStatus.businessSummary', 'Business Summary')}
      </h3>

      <Card className="eb-overflow-hidden eb-shadow-sm eb-transition-all eb-duration-200 hover:eb-shadow-md">
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
                  <Building className="eb-h-4 eb-w-4" />
                </div>
                <div className="eb-flex-1">
                  <div className="eb-flex eb-items-center eb-gap-2">
                    <div className="eb-font-medium eb-text-gray-800">
                      {businessDetails.organizationDetails?.organizationName}
                    </div>
                    {hasMissingBusinessDocs && isInformationRequested && (
                      <div className="eb-flex eb-items-center eb-text-amber-600">
                        <AlertCircle className="eb-h-4 eb-w-4" />
                      </div>
                    )}
                  </div>
                  <div className="eb-mt-1 eb-flex eb-flex-wrap eb-gap-1">
                    <Badge
                      variant="outline"
                      className="eb-bg-gray-50 eb-text-xs eb-font-normal"
                    >
                      {businessDetails.organizationDetails?.organizationType
                        ? t(
                            `organizationTypes.${businessDetails.organizationDetails.organizationType}`,
                            businessDetails.organizationDetails.organizationType
                          )
                        : t(
                            'clientOnboardingStatus.labels.organization',
                            'Organization'
                          )}
                    </Badge>
                    {businessDetails.roles?.map((role) => (
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
                {hasMissingBusinessDocs && isInformationRequested && (
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
                        onClick={handleOpenUploadModal}
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

                {hasMissingBusinessDocs && !isInformationRequested && (
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

                {businessDetails.email && (
                  <DetailItem
                    label={t('clientOnboardingStatus.labels.email', 'Email')}
                    value={businessDetails.email}
                  />
                )}

                {businessDetails.organizationDetails?.yearOfFormation && (
                  <DetailItem
                    label={t(
                      'clientOnboardingStatus.labels.yearOfFormation',
                      'Year of Formation'
                    )}
                    value={businessDetails.organizationDetails.yearOfFormation.toString()}
                  />
                )}

                {clientData.products && clientData.products.length > 0 && (
                  <DetailItem
                    label={t(
                      'clientOnboardingStatus.labels.product',
                      'Products'
                    )}
                    value={clientData.products
                      .map((product) => t(`clientProducts.${product}`, product))
                      .join(', ')}
                  />
                )}

                {businessDetails.organizationDetails?.website && (
                  <DetailItem
                    label={t(
                      'clientOnboardingStatus.labels.website',
                      'Website'
                    )}
                    value={businessDetails.organizationDetails.website}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        partyId={businessDetails.id}
        title={`Upload Documents for ${businessDetails.organizationDetails?.organizationName}`}
      />
    </div>
  );
};
