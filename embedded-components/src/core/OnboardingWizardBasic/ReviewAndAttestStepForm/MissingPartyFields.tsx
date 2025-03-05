import { AlertTriangle } from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MissingPartyFields = ({ party }: { party: PartyResponse }) => {
  const validationResponseFields = party?.validationResponse?.filter((r) => {
    const needsInfo = r.validationStatus === 'NEEDS_INFO';
    return needsInfo;
  })?.[0]?.fields;

  if (!validationResponseFields?.length) {
    return null;
  }

  return (
    <Alert variant="destructive" className="eb-mt-2">
      <AlertTriangle className="eb-h-4 eb-w-4" />
      <AlertDescription>
        <p className="eb-mb-2">
          Action required: Please provide the following missing information
        </p>
        <ul className="eb-mt-2 eb-list-inside eb-list-disc">
          {validationResponseFields.map((field, index) => (
            <li key={index}>
              <span className="eb-font-medium">{field.name}</span>: {field.type}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
