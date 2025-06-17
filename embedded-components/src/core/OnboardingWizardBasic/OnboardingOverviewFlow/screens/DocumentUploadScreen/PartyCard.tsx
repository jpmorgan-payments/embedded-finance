import { FC } from 'react';
import {
  AlertTriangle,
  CheckCircle2Icon,
  CheckIcon,
  CircleDashedIcon,
  UploadIcon,
} from 'lucide-react';

import {
  DocumentRequestStatus,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { Badge, Button, Card } from '@/components/ui';

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
  docRequestStatus?: DocumentRequestStatus;
  /**
   * Callback function when upload button is clicked
   */
  onUploadClick: (party: PartyResponse) => void;
}

/**
 * Component to display a party card with document upload functionality
 */
export const PartyCard: FC<PartyCardProps> = ({
  party,
  docRequestStatus,
  onUploadClick,
}) => {
  return (
    <Card className="eb-space-y-6 eb-rounded-lg eb-border eb-p-6 eb-shadow">
      <div className="eb-space-y-1.5">
        <div className="eb-flex eb-items-center eb-justify-between">
          <h3 className="eb-font-header eb-text-lg eb-font-medium">
            {getPartyName(party)}
          </h3>
          {docRequestStatus === 'ACTIVE' && (
            <span>
              <CircleDashedIcon className="eb-size-5 eb-text-muted-foreground" />
              <span className="eb-sr-only">Pending</span>
            </span>
          )}
          {docRequestStatus === 'CLOSED' && (
            <span>
              <CheckCircle2Icon className="eb-size-5 eb-stroke-green-700" />
              <span className="eb-sr-only">Completed</span>
            </span>
          )}
          {docRequestStatus === 'EXPIRED' && (
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
        {docRequestStatus === 'ACTIVE' ? (
          <Button
            variant="outline"
            className="eb-w-full eb-border-primary eb-text-primary"
            onClick={() => onUploadClick(party)}
          >
            <UploadIcon /> Upload documents
          </Button>
        ) : (
          <div className="eb-inline-flex eb-items-center eb-justify-center eb-gap-2 eb-text-xs eb-text-green-700">
            <CheckIcon className="eb-size-4" />
            Required documents successfully uploaded
          </div>
        )}
      </div>
    </Card>
  );
};
