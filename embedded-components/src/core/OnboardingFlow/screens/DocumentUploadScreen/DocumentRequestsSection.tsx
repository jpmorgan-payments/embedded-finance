import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DocumentRequestResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { Card } from '@/components/ui';

import { PartyCard } from './PartyCard';

interface DocumentRequestsSectionProps {
  /**
   * Title of the section
   */
  title: string;
  /**
   * Document requests to display
   */
  documentRequests: DocumentRequestResponse[];
  /**
   * Client data containing party information
   */
  clientData: { parties?: PartyResponse[] } | undefined;
  /**
   * Handler for when upload button is clicked
   */
  onDocRequestSelect: (id: string | undefined) => void;
}

/**
 * Component that displays a section of document requests with a title
 */
export const DocumentRequestsSection: FC<DocumentRequestsSectionProps> = ({
  title,
  documentRequests,
  clientData,
  onDocRequestSelect,
}) => {
  const { t } = useTranslation(['onboarding-overview']);

  if (!clientData?.parties) return null;

  return (
    <div className="eb-space-y-3">
      <h2 className="eb-font-header eb-text-2xl eb-font-medium">{title}</h2>
      {documentRequests.length > 0 ? (
        documentRequests.map((docRequest) => {
          // Find the party associated with this document request
          const party = docRequest.partyId
            ? clientData.parties?.find((p) => p.id === docRequest.partyId)
            : clientData.parties?.find((p) => p.roles?.includes('CLIENT'));

          if (!party) return null;

          return (
            <PartyCard
              key={party.id}
              party={party}
              docRequest={docRequest}
              onUploadClick={() => onDocRequestSelect(docRequest.id)}
            />
          );
        })
      ) : (
        <Card className="eb-space-y-6 eb-rounded-lg eb-border eb-p-6 eb-shadow">
          <p className="eb-flex eb-items-center eb-justify-center eb-text-sm eb-font-medium">
            {t('onboarding-overview:documentUpload.noDocumentsRequired')}
          </p>
        </Card>
      )}
    </div>
  );
};
