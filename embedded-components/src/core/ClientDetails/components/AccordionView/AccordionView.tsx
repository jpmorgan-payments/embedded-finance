/**
 * AccordionView - Client details in collapsible sections (business-order grouping).
 * Sections: Client information, Verification results, Organization, Controller, Beneficial owners, Question responses.
 */

import { useTranslationWithTokens } from '@/hooks';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  getClientDetailsSections,
  SECTION_I18N_KEYS,
} from '../../utils/partyGrouping';
import { BeneficialOwnersSection } from '../ClientDetailsContent/BeneficialOwnersSection';
import { ClientInfoSection } from '../ClientDetailsContent/ClientInfoSection';
import { ControllerSection } from '../ClientDetailsContent/ControllerSection';
import { OrganizationSection } from '../ClientDetailsContent/OrganizationSection';
import { QuestionResponsesSection } from '../ClientDetailsContent/QuestionResponsesSection';
import { ResultsSection } from '../ClientDetailsContent/ResultsSection';

interface AccordionViewProps {
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
      return <ClientInfoSection client={client} />;
    case 'organization':
      return <OrganizationSection client={client} />;
    case 'controller':
      return <ControllerSection client={client} />;
    case 'beneficial-owners':
      return <BeneficialOwnersSection client={client} />;
    case 'question-responses':
      return <QuestionResponsesSection client={client} />;
    case 'results':
      return <ResultsSection client={client} />;
    default:
      return null;
  }
}

export function AccordionView({ client }: AccordionViewProps) {
  const { t } = useTranslationWithTokens('client-details');
  const sections = getClientDetailsSections(client);

  return (
    <Accordion
      type="single"
      collapsible
      className="eb-w-full"
      defaultValue={sections[0]?.id}
    >
      <div className="eb-space-y-1">
        {sections.map(({ id, type }) => (
          <AccordionItem
            key={id}
            value={id}
            className={cn(
              'eb-rounded-lg eb-border eb-border-border eb-bg-card eb-transition-all eb-duration-200',
              'data-[state=open]:eb-shadow-sm'
            )}
          >
            <AccordionTrigger
              className={cn(
                'eb-px-4 eb-py-3 hover:eb-no-underline @md:eb-px-5',
                'eb-bg-transparent hover:eb-bg-muted/40',
                'data-[state=open]:eb-rounded-b-none data-[state=open]:eb-bg-muted/20'
              )}
            >
              <span className="eb-flex eb-items-center eb-gap-2 eb-text-left eb-text-sm eb-font-medium eb-text-foreground @md:eb-text-base">
                <ChevronDown
                  className="eb-h-4 eb-w-4 eb-shrink-0 eb-transition-transform eb-duration-200 data-[state=open]:eb-rotate-180"
                  aria-hidden
                />
                {t(`sections.${SECTION_I18N_KEYS[type]}` as const)}
              </span>
            </AccordionTrigger>
            <AccordionContent className="eb-px-4 eb-pb-4 eb-pt-0 @md:eb-px-5">
              <SectionContent client={client} type={type} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </div>
    </Accordion>
  );
}
