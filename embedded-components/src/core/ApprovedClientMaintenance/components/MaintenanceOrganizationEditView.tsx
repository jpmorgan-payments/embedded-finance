import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import type { MaintenancePartyUpdateRequest } from '../models/maintenanceApi.types';
import type { OrganizationMaintenanceValues } from '../utils/buildOrganizationPartyUpdate';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { OrganizationChangeEditor } from './OrganizationChangeEditor';

type MaintenanceOrganizationEditViewProps = {
  variant: 'client' | 'intermediary';
  breadcrumbs: MaintenanceBreadcrumbItem[];
  initialValues: OrganizationMaintenanceValues;
  approvedValues: OrganizationMaintenanceValues;
  isSubmitting: boolean;
  mutationError?: unknown;
  onBack: () => void;
  onSave: (request: MaintenancePartyUpdateRequest) => Promise<void>;
};

export function MaintenanceOrganizationEditView({
  variant,
  breadcrumbs,
  initialValues,
  approvedValues,
  isSubmitting,
  mutationError,
  onBack,
  onSave,
}: MaintenanceOrganizationEditViewProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {t('placeholders.editBusiness')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('organizationForm.editDescription')}
        </p>
      </header>
      <div className="eb-w-full">
        <OrganizationChangeEditor
          variant={variant}
          initialValues={initialValues}
          approvedValues={approvedValues}
          isSubmitting={isSubmitting}
          mutationError={mutationError}
          onCancel={onBack}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
