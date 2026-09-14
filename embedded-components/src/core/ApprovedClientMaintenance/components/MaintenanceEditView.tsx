import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import type {
  MaintenanceAddress,
  MaintenanceIndividualId,
} from '../models/maintenanceApi.types';
import type {
  IndividualMaintenanceValues,
  PartyNameUpdateRequest,
} from '../utils/buildPartyNameUpdate';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { PartyChangeEditor } from './PartyChangeEditor';

type MaintenanceEditViewProps = {
  breadcrumbs: MaintenanceBreadcrumbItem[];
  initialValues: IndividualMaintenanceValues;
  originalValues: IndividualMaintenanceValues;
  approvedAddresses: MaintenanceAddress[];
  approvedIndividualIds: MaintenanceIndividualId[];
  isSubmitting: boolean;
  mutationError?: unknown;
  lockedCountry?: string;
  onBack: () => void;
  onSave: (
    values: IndividualMaintenanceValues,
    request: PartyNameUpdateRequest
  ) => Promise<void>;
};

export function MaintenanceEditView({
  breadcrumbs,
  initialValues,
  originalValues,
  approvedAddresses,
  approvedIndividualIds,
  isSubmitting,
  mutationError,
  lockedCountry,
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
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('nameEditor.editDescription')}
        </p>
      </header>
      <div className="eb-w-full">
        <PartyChangeEditor
          initialValues={initialValues}
          approvedValues={originalValues}
          approvedAddresses={approvedAddresses}
          approvedIndividualIds={approvedIndividualIds}
          isSubmitting={isSubmitting}
          mutationError={mutationError}
          lockedCountry={lockedCountry}
          onDiscard={onBack}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
