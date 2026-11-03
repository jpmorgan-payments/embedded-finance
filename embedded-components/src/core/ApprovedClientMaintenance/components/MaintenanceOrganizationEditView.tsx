import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { cn } from '@/lib/utils';

import type { MaintenancePartyUpdateRequest } from '../models/maintenanceApi.types';
import type { OrganizationMaintenanceValues } from '../utils/buildOrganizationPartyUpdate';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import {
  CHANGE_CARD_CLASS,
  CHANGE_HEADER_CLASS,
  HEADER_CLASS,
  MaintenanceChangeEyebrow,
  PAGE_CLASS,
} from './MaintenanceChangeEyebrow';
import { OrganizationChangeEditor } from './OrganizationChangeEditor';

type MaintenanceOrganizationEditViewProps = {
  variant: 'client' | 'intermediary';
  breadcrumbs: MaintenanceBreadcrumbItem[];
  initialValues: OrganizationMaintenanceValues;
  approvedValues: OrganizationMaintenanceValues;
  isSubmitting: boolean;
  mutationError?: unknown;
  isPendingAddition?: boolean;
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
  isPendingAddition,
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
    <div className={cn(PAGE_CLASS, CHANGE_CARD_CLASS)}>
      <header className={cn(HEADER_CLASS, CHANGE_HEADER_CLASS)}>
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <MaintenanceChangeEyebrow />
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
      <div className="eb-w-full" data-maintenance-page-fill="">
        <OrganizationChangeEditor
          variant={variant}
          initialValues={initialValues}
          approvedValues={approvedValues}
          isSubmitting={isSubmitting}
          mutationError={mutationError}
          isPendingAddition={isPendingAddition}
          onCancel={onBack}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
