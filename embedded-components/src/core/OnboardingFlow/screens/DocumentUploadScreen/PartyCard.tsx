import { FC, Fragment } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangle,
  CheckCircle2Icon,
  CheckIcon,
  CircleDashedIcon,
  ClockIcon,
  FileIcon,
  UploadIcon,
} from 'lucide-react';

import { useSmbdoGetAllDocumentDetails } from '@/api/generated/smbdo';
import {
  DocumentMetadataSmbdo,
  DocumentRequestResponse,
  DocumentResponse,
  DocumentTypeSmbdo,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, Card } from '@/components/ui';
import { DOCUMENT_TYPE_MAPPING } from '@/core/OnboardingFlow/config';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';

import { getPartyName } from '../../utils/dataUtils';

/**
 * Interface for the PartyCardProps component
 */
export interface PartyCardProps {
  /**
   * Party data to be displayed
   */
  party: PartyResponse;
  /**
   * Status of the document request
   */
  docRequest: DocumentRequestResponse;
  /**
   * Callback function when upload button is clicked
   */
  onUploadClick: () => void;
}

/**
 * Interface for grouped documents
 */
interface DocumentGroup {
  documentType: DocumentTypeSmbdo;
  documents: DocumentResponse[];
}

/** Format upload timestamps for PartyCard; invalid ISO strings fall back to the raw value. */
export function formatPartyCardUploadTime(timestamp: string): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

/**
 * Component to display a party card with document upload functionality
 */
export const PartyCard: FC<PartyCardProps> = ({
  party,
  docRequest,
  onUploadClick,
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview']);

  // Helper function to get metadata value
  const getMetadataValue = (
    metadata: DocumentMetadataSmbdo[],
    key: string
  ): string | undefined => {
    return metadata?.find((m) => m.key === key)?.value;
  };

  // Group documents by document type
  const groupDocumentsByType = (
    documents?: DocumentResponse[]
  ): DocumentGroup[] => {
    if (!documents || documents.length === 0) return [];

    const groupedDocuments: Record<DocumentTypeSmbdo, DocumentResponse[]> =
      Object.values(DocumentTypeSmbdo).reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<DocumentTypeSmbdo, DocumentResponse[]>
      );

    documents.forEach((doc) => {
      const type = doc.documentType;
      groupedDocuments[type].push(doc);
    });

    return Object.keys(groupedDocuments).map((type) => ({
      documentType: type as DocumentTypeSmbdo,
      documents: groupedDocuments[type as DocumentTypeSmbdo],
    }));
  };

  const { clientData } = useOnboardingContext();

  const { data: { documentDetails: documentDetailsList } = {}, isLoading } =
    useSmbdoGetAllDocumentDetails({
      clientId: clientData?.id,
      ...(party.roles?.includes('CLIENT') ? {} : { partyId: party.id }),
    });

  const filteredDocumentDetailsList = documentDetailsList?.filter(
    (doc) =>
      doc.metadata.find((m) => m.key === 'DOCUMENT_REQUEST_ID')?.value ===
      docRequest.id
  );

  const documentGroups = groupDocumentsByType(filteredDocumentDetailsList);

  return (
    <Card className="eb-overflow-hidden eb-rounded-lg eb-border eb-shadow-sm">
      {/* Header */}
      <div className="eb-flex eb-items-start eb-justify-between eb-gap-3 eb-px-5 eb-py-4">
        <div className="eb-min-w-0 eb-space-y-0.5">
          <h3 className="eb-min-w-0 eb-break-words eb-font-header eb-text-base eb-font-semibold eb-leading-tight">
            {getPartyName(party)}
          </h3>
          <p className="eb-text-sm eb-text-muted-foreground">
            {(
              [
                party.roles?.includes('CLIENT') &&
                  t(
                    'onboarding-overview:documentUpload.partyCard.roleLabels.business'
                  ),
                party.roles?.includes('BENEFICIAL_OWNER') &&
                  t(
                    'onboarding-overview:documentUpload.partyCard.roleLabels.owner'
                  ),
                party.roles?.includes('CONTROLLER') &&
                  t(
                    'onboarding-overview:documentUpload.partyCard.roleLabels.controller'
                  ),
              ] as const
            )
              .filter(Boolean)
              .map((role, index) => (
                <Fragment key={index}>
                  {index > 0 && ' · '}
                  {role}
                </Fragment>
              ))}
          </p>
        </div>
        <div className="eb-shrink-0 eb-pt-0.5">
          {docRequest.status === 'ACTIVE' && (
            <span className="eb-flex eb-items-center eb-gap-1 eb-text-muted-foreground">
              <CircleDashedIcon className="eb-size-5" />
            </span>
          )}
          {docRequest.status === 'CLOSED' && (
            <span className="eb-flex eb-items-center eb-gap-1 eb-text-green-700">
              <CheckCircle2Icon className="eb-size-5" />
            </span>
          )}
          {docRequest.status === 'EXPIRED' && (
            <span className="eb-flex eb-items-center eb-gap-1 eb-text-[#C75300]">
              <AlertTriangle className="eb-size-5" />
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="eb-space-y-4 eb-px-5 eb-py-4">
        {/* Action / Status */}
        {docRequest.status === 'ACTIVE' ? (
          <Button
            variant="outline"
            className="eb-w-full eb-border-primary eb-text-primary"
            onClick={onUploadClick}
          >
            <UploadIcon className="eb-size-4" />{' '}
            {t('onboarding-overview:documentUpload.partyCard.uploadDocuments')}
          </Button>
        ) : (
          <div className="eb-flex eb-items-center eb-gap-1.5 eb-text-sm eb-text-green-700">
            <CheckIcon className="eb-size-4" />
            {t('onboarding-overview:documentUpload.partyCard.successMessage')}
          </div>
        )}

        {/* Document list */}
        {isLoading && (
          <div className="eb-space-y-2">
            <div className="eb-rounded-md eb-border eb-border-dashed eb-p-3">
              <div className="eb-flex eb-items-center eb-gap-2">
                <Skeleton className="eb-size-4 eb-rounded" />
                <Skeleton className="eb-h-4 eb-w-28" />
              </div>
              <div className="eb-ml-6 eb-mt-3 eb-flex eb-items-center eb-gap-2">
                <Skeleton className="eb-h-4 eb-w-8 eb-rounded" />
                <Skeleton className="eb-h-3 eb-w-40" />
              </div>
            </div>
          </div>
        )}
        {!isLoading &&
          documentGroups.map((group) => {
            if (group.documents.length === 0) return null;
            return (
              <div
                key={group.documentType}
                className="eb-rounded-md eb-border eb-p-3"
              >
                <div className="eb-flex eb-items-center eb-gap-2">
                  <FileIcon className="eb-size-4 eb-text-muted-foreground" />
                  <span className="eb-text-sm eb-font-medium">
                    {DOCUMENT_TYPE_MAPPING[group.documentType]?.label ||
                      group.documentType}
                  </span>
                </div>

                {group.documents.map((docDetail) => {
                  const uploadTime = getMetadataValue(
                    docDetail.metadata,
                    'UPLOAD_TIME'
                  );
                  const fileExtension = getMetadataValue(
                    docDetail.metadata,
                    'FILE_EXTENSION'
                  );

                  return (
                    <div
                      key={docDetail.id}
                      className="eb-ml-6 eb-mt-2 eb-flex eb-items-center eb-gap-2"
                    >
                      {fileExtension && (
                        <span className="eb-inline-flex eb-items-center eb-rounded eb-bg-muted eb-px-1.5 eb-py-0.5 eb-text-[10px] eb-font-semibold eb-uppercase eb-text-muted-foreground">
                          {fileExtension}
                        </span>
                      )}
                      {uploadTime && (
                        <span className="eb-flex eb-items-center eb-gap-1 eb-text-xs eb-text-muted-foreground">
                          <ClockIcon className="eb-size-3" />
                          {formatPartyCardUploadTime(uploadTime)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </Card>
  );
};
