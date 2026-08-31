import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';

import type { PartyNameUpdateRequest } from '../utils/buildPartyNameUpdate';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceSection } from './MaintenanceSection';
import { PartyChangeEditor } from './PartyChangeEditor';

type MaintenanceEditViewProps = {
  breadcrumbs: MaintenanceBreadcrumbItem[];
  initialValues: IndividualLegalNameValues;
  originalValues: IndividualLegalNameValues;
  isSubmitting: boolean;
  mutationError?: unknown;
  onBack: () => void;
  onSave: (
    values: IndividualLegalNameValues,
    request: PartyNameUpdateRequest
  ) => Promise<void>;
};

export function MaintenanceEditView({
  breadcrumbs,
  initialValues,
  originalValues,
  isSubmitting,
  mutationError,
  onBack,
  onSave,
}: MaintenanceEditViewProps) {
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
          {t('entity.editDetails')}
        </h2>
      </header>
      <MaintenanceSection
        id="edit-details-heading"
        title={t('nameEditor.fieldsTitle')}
        caption={t('sectionCaption.edit')}
      >
        <PartyChangeEditor
          initialValues={initialValues}
          approvedValues={originalValues}
          isSubmitting={isSubmitting}
          mutationError={mutationError}
          onDiscard={onBack}
          onSave={onSave}
        />
      </MaintenanceSection>
    </div>
  );
}
