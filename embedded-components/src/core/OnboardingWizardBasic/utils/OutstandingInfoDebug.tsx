import { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const OutstandingInfoDebug = ({
  clientData,
}: {
  clientData: ClientResponse;
}) => {
  if (localStorage.getItem('debug') !== 'true') {
    return null;
  }
  return (
    <Accordion
      type="single"
      collapsible
      className="eb-w-fit eb-border eb-border-blue-500 eb-bg-blue-50 eb-px-2 eb-py-0 eb-text-sm eb-leading-3"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>
          DEBUG ONLY : Outstanding client info from GET /clients/:id
        </AccordionTrigger>
        <AccordionContent>
          <div className="eb-grid eb-grid-cols-1 eb-gap-2 md:eb-grid-cols-2">
            <div>
              <b>Client level outstanding info</b>
              <pre className="eb-py-1 eb-text-sm">
                {JSON.stringify(clientData?.outstanding, null, 2)}
              </pre>
            </div>
            <div>
              <b>Parties validationResponse \ missing fields</b>
              {clientData?.parties?.map((party) => (
                <div key={party?.id}>
                  <b>Party ID = {party?.id}</b>
                  <pre className="eb-py-1 eb-text-sm">
                    {JSON.stringify(party?.validationResponse, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
