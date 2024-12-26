import { ClientResponse } from '@/api/generated/smbdo.schemas';
import { AlertDescription } from '@/components/ui/alert';
import { Alert } from '@/components/ui';

export const OutstandingInfoDebug = ({
  clientData,
}: {
  clientData: ClientResponse;
}) => {
  if (localStorage.getItem('debug') !== 'true') {
    return null;
  }
  return (
    <Alert variant="default">
      <AlertDescription>
        <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
          <div>
            <b>Client level outstanding info</b>
            <pre>{JSON.stringify(clientData?.outstanding, null, 2)}</pre>
          </div>
          <div>
            <b>Parties validationResponse \ missing fields</b>
            {clientData?.parties?.map((party) => (
              <div key={party?.id}>
                <b>Party ID = {party?.id}</b>
                <pre>{JSON.stringify(party?.validationResponse, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
