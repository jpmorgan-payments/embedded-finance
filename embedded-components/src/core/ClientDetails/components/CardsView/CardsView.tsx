/**
 * CardsView - Client details as cards (business-order grouping).
 * One card per section: Client information, Verification results, Organization, Controller, Beneficial owners, Question responses.
 */

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { getClientDetailsSections } from '../../utils/partyGrouping';
import { BeneficialOwnersSection } from '../ClientDetailsContent/BeneficialOwnersSection';
import { ClientInfoSection } from '../ClientDetailsContent/ClientInfoSection';
import { ControllerSection } from '../ClientDetailsContent/ControllerSection';
import { OrganizationSection } from '../ClientDetailsContent/OrganizationSection';
import { QuestionResponsesSection } from '../ClientDetailsContent/QuestionResponsesSection';
import { ResultsSection } from '../ClientDetailsContent/ResultsSection';

interface CardsViewProps {
  client: ClientResponse;
}

function SectionContent({
  client,
  type,
}: {
  client: ClientResponse;
  type: string;
}) {
  switch (type) {
    case 'client-info':
      return <ClientInfoSection client={client} title="" />;
    case 'organization':
      return <OrganizationSection client={client} title="" />;
    case 'controller':
      return <ControllerSection client={client} title="" />;
    case 'beneficial-owners':
      return <BeneficialOwnersSection client={client} title="" />;
    case 'question-responses':
      return <QuestionResponsesSection client={client} title="" />;
    case 'results':
      return <ResultsSection client={client} title="" />;
    default:
      return null;
  }
}

export function CardsView({ client }: CardsViewProps) {
  const sections = getClientDetailsSections(client);

  return (
    <div className="eb-grid eb-w-full eb-grid-cols-1 eb-gap-4 @md:eb-grid-cols-2 @md:eb-gap-5 @3xl:eb-max-w-4xl">
      {sections.map(({ id, label, type }) => (
        <Card
          key={id}
          className={cn(
            'eb-overflow-hidden eb-rounded-lg eb-border eb-border-border eb-bg-card eb-shadow-sm',
            'eb-transition-all eb-duration-200 hover:eb-border-border/80 hover:eb-shadow-md'
          )}
        >
          <CardHeader className="eb-border-b eb-border-border eb-px-4 eb-pb-3 eb-pt-4 @md:eb-px-5 @md:eb-pt-5">
            <CardTitle className="eb-text-base eb-font-semibold eb-tracking-tight @md:eb-text-lg">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-px-4 eb-pb-4 eb-pt-3 @md:eb-px-5 @md:eb-pb-5 @md:eb-pt-4">
            <SectionContent client={client} type={type} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
