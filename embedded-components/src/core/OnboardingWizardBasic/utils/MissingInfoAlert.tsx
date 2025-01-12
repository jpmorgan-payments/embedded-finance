import { ClientResponse } from '@/api/generated/smbdo.schemas';
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MissingInfoAlert = ({
  clientData,
}: {
  clientData: ClientResponse;
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const getMissingFields = () => {
    const missing: string[] = [];

    // Check attestations
    if (clientData?.outstanding?.attestationDocumentIds && clientData.outstanding.attestationDocumentIds.length > 0) {
      missing.push(`Missing attestation documents (${clientData.outstanding.attestationDocumentIds.length})`);
    }

    // Check party roles
    if (clientData?.outstanding?.partyRoles && clientData.outstanding.partyRoles.length > 0) {
      missing.push(`Missing parties with roles: ${clientData.outstanding.partyRoles.join(', ')}`);
    }

    // Check questions
    if (clientData?.outstanding?.questionIds && clientData.outstanding.questionIds.length > 0) {
      missing.push(`Missing answers for ${clientData.outstanding.questionIds.length} questions`);
    }

    return missing;
  };

  const getPartyMissingFields = (party: any) => {
    if (!party.validationResponse) return null;
    
    const missingFields = party.validationResponse.flatMap((validation: { fields: any[]; }) => 
      validation.fields?.map(field => field.name) ?? []
    );
    
    return missingFields.length > 0 ? missingFields : null;
  };

  const missingFields = getMissingFields();
  const hasAnyMissingInfo = missingFields.length > 0 || (clientData?.parties && clientData.parties.some(party => {
    const fields = getPartyMissingFields(party);
    return fields && fields.length > 0;
  }));

  if (!hasAnyMissingInfo || isDismissed) return null;

  return (
    <div className="eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded-md eb-p-3 eb-text-sm eb-text-blue-900 eb-mb-4 eb-relative">
      <Button
        onClick={() => setIsDismissed(true)}
        variant="ghost"
        size="icon"
        className="eb-absolute eb-right-2 eb-top-2 eb-h-6 eb-w-6 eb-p-0"
        aria-label="Dismiss alert"
      >
        <X className="eb-h-4 eb-w-4" />
      </Button>
      <div className="eb-font-medium eb-mb-2">Missing Information:</div>
      <div className="eb-space-y-2">
        {missingFields.length > 0 && (
          <div className="eb-flex eb-flex-wrap eb-gap-2">
            {missingFields.map((field, index) => (
              <span 
                key={index}
                className="eb-bg-blue-100 eb-text-blue-800 eb-px-2 eb-py-1 eb-rounded-full eb-text-xs eb-font-medium"
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
              <div className="eb-text-xs eb-font-medium eb-mb-1">
                {party.partyType} ({party.id}):
              </div>
              <div className="eb-flex eb-flex-wrap eb-gap-2">
                {partyMissingFields.map((field: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Iterable<ReactNode> | null | undefined, index: Key | null | undefined) => (
                  <span 
                    key={index}
                    className="eb-bg-blue-100 eb-text-blue-800 eb-px-2 eb-py-1 eb-rounded-full eb-text-xs eb-font-medium"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
