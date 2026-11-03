import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { cn } from '@/lib/utils';

import type {
  MaintenanceAddress,
  MaintenanceIndividualId,
  MaintenancePartyUpdateRequest,
} from '../models/maintenanceApi.types';
import type { IndividualMaintenanceValues } from '../utils/buildPartyNameUpdate';
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
  isPendingAddition?: boolean;
  onBack: () => void;
  onSave: (
    values: IndividualMaintenanceValues,
    request: MaintenancePartyUpdateRequest
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
  isPendingAddition,
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
          {t('entity.editDetails')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('nameEditor.editDescription')}
        </p>
      </header>
      <div className="eb-w-full" data-maintenance-page-fill="">
        <PartyChangeEditor
          initialValues={initialValues}
          approvedValues={originalValues}
          approvedAddresses={approvedAddresses}
          approvedIndividualIds={approvedIndividualIds}
          isSubmitting={isSubmitting}
          mutationError={mutationError}
          lockedCountry={lockedCountry}
          isPendingAddition={isPendingAddition}
          onDiscard={onBack}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
