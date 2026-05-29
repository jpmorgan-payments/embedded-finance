/**
 * ClientDetailsContent - Shared content (Review-and-attest–style grouping).
 * Renders: client info, Organization, Controller, Beneficial owners, question responses, results.
 */

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { BeneficialOwnersSection } from './BeneficialOwnersSection';
import { ClientInfoSection } from './ClientInfoSection';
import { ControllerSection } from './ControllerSection';
import { OrganizationSection } from './OrganizationSection';
import { QuestionResponsesSection } from './QuestionResponsesSection';
import { ResultsSection } from './ResultsSection';

interface ClientDetailsContentProps {
  client: ClientResponse;
}

export function ClientDetailsContent({ client }: ClientDetailsContentProps) {
  return (
    <div className="eb-flex eb-w-full eb-flex-col eb-gap-6">
      <ClientInfoSection client={client} />
      <ResultsSection client={client} />
      <OrganizationSection client={client} />
      <ControllerSection client={client} />
      <BeneficialOwnersSection client={client} />
      <QuestionResponsesSection client={client} />
    </div>
  );
}
