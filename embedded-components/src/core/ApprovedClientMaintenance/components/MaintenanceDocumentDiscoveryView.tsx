import { useTranslationWithTokens } from '@/i18n';
import { Loader2Icon } from 'lucide-react';

import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';

export function MaintenanceDocumentDiscoveryView({
  breadcrumbs,
}: {
  breadcrumbs: MaintenanceBreadcrumbItem[];
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2 className="eb-text-lg eb-font-semibold">
          {t('flow.preparingRequiredDocuments')}
        </h2>
      </header>
      <div className="eb-flex eb-items-start eb-gap-3 eb-p-5">
        <Loader2Icon
          className="eb-mt-0.5 eb-size-5 eb-shrink-0 eb-animate-spin eb-text-informative"
          aria-hidden="true"
        />
        <p className="eb-text-sm eb-text-muted-foreground">
          {t('flow.preparingRequiredDocumentsDescription')}
        </p>
      </div>
    </div>
  );
}
