import { FC } from 'react';
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
import { Badge, Button, Card } from '@/components/ui';
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

/**
 * Component to display a party card with document upload functionality
 */
export const PartyCard: FC<PartyCardProps> = ({
  party,
  docRequest,
  onUploadClick,
}) => {
  // Helper function to format timestamp to readable date
  const formatUploadTime = (timestamp: string): string => {
    if (!timestamp) return '';

    const date = new Date(parseInt(timestamp, 10));
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  };

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

  const { data: { documentDetails: documentDetailsList } = {} } =
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
    <Card className="eb-space-y-6 eb-rounded-lg eb-border eb-p-6 eb-shadow">
      <div className="eb-space-y-1.5">
        <div className="eb-flex eb-items-center eb-justify-between">
          <h3 className="eb-min-w-0 eb-shrink eb-overflow-hidden eb-break-words eb-font-header eb-text-lg eb-font-medium">
            {getPartyName(party)}
          </h3>
          {docRequest.status === 'ACTIVE' && (
            <span>
              <CircleDashedIcon className="eb-size-5 eb-text-muted-foreground" />
              <span className="eb-sr-only">Pending</span>
            </span>
          )}
          {docRequest.status === 'CLOSED' && (
            <span>
              <CheckCircle2Icon className="eb-size-5 eb-stroke-green-700" />
              <span className="eb-sr-only">Completed</span>
            </span>
          )}
          {docRequest.status === 'EXPIRED' && (
            <span>
              <AlertTriangle className="eb-size-5 eb-stroke-[#C75300]" />
              <span className="eb-sr-only">Expired</span>
            </span>
          )}
        </div>
        <div className="eb-flex eb-gap-2">
          {party.roles?.includes('CLIENT') && (
            <Badge variant="subtle" size="lg">
              Business
            </Badge>
          )}
          {party.roles?.includes('BENEFICIAL_OWNER') && (
            <Badge variant="subtle" size="lg">
              Owner
            </Badge>
          )}
          {party.roles?.includes('CONTROLLER') && (
            <Badge variant="subtle" size="lg">
              Controller
            </Badge>
          )}
        </div>
      </div>
      <div>
        {docRequest.status === 'ACTIVE' ? (
          <Button
            variant="outline"
            className="eb-w-full eb-border-primary eb-text-primary"
            onClick={onUploadClick}
          >
            <UploadIcon /> Upload documents
          </Button>
        ) : (
          <div className="eb-inline-flex eb-items-center eb-justify-center eb-gap-2 eb-text-xs eb-text-green-700">
            <CheckIcon className="eb-size-4" />
            Required documents successfully uploaded
          </div>
        )}
        <div>
          {documentGroups.map((group) => {
            if (group.documents.length === 0) return null;
            return (
              <div
                key={group.documentType}
                className="eb-mt-2 eb-rounded-md eb-border eb-p-2"
              >
                <div className="eb-flex eb-items-center eb-gap-2">
                  <FileIcon className="eb-size-4 eb-text-muted-foreground" />
                  <span className="eb-text-sm eb-font-medium">
                    {DOCUMENT_TYPE_MAPPING[group.documentType]?.label ||
                      group.documentType}
                  </span>
                </div>

                {group.documents.map((docDetail) => {
                  const fileName = getMetadataValue(
                    docDetail.metadata,
                    'UPLOADED_FILE_NAME'
                  );
                  const uploadTime = getMetadataValue(
                    docDetail.metadata,
                    'UPLOAD_TIME'
                  );

                  return (
                    <div key={docDetail.id} className="eb-ml-6 eb-mt-2">
                      {fileName && (
                        <div className="eb-flex eb-items-center eb-gap-2">
                          <span
                            className="eb-max-w-[200px] eb-truncate eb-text-xs eb-text-muted-foreground"
                            title={fileName}
                          >
                            {fileName}
                          </span>
                        </div>
                      )}
                      {uploadTime && (
                        <div className="eb-mt-1 eb-flex eb-items-center eb-gap-2">
                          <ClockIcon className="eb-size-3 eb-text-muted-foreground" />
                          <span className="eb-text-xs eb-text-muted-foreground">
                            Uploaded on {formatUploadTime(uploadTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
