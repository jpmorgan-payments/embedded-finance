import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { useMaintenanceFormExitGuard } from '../hooks/useMaintenanceFormExitGuard';
import type { MaintenancePartyCreateRequest } from '../models/maintenanceApi.types';
import { AddRelatedPartyForm } from './AddRelatedPartyForm';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import { MaintenanceUnsavedChangesDialog } from './MaintenanceUnsavedChangesDialog';

type RelatedPartyRole = 'CONTROLLER' | 'BENEFICIAL_OWNER';

type MaintenanceAddPartyViewProps = {
  breadcrumbs: MaintenanceBreadcrumbItem[];
  parentPartyId: string;
  natureOfOwnership?: 'Direct' | 'Indirect';
  /** The business a new owner connects to, shown so the choice stays visible. */
  connectionName?: string;
  isControllerReplacement?: boolean;
  canAlsoBeBeneficialOwner?: boolean;
  ownershipBusinesses?: Array<{ partyId: string; name: string }>;
  allowedRoles: RelatedPartyRole[];
  isSubmitting: boolean;
  mutationError?: unknown;
  lockedCountry?: string;
  onBack: () => void;
  onSave: (request: MaintenancePartyCreateRequest) => Promise<void>;
};

export function MaintenanceAddPartyView({
  breadcrumbs,
  parentPartyId,
  natureOfOwnership,
  connectionName,
  isControllerReplacement,
  canAlsoBeBeneficialOwner,
  ownershipBusinesses,
  allowedRoles,
  isSubmitting,
  mutationError,
  lockedCountry,
  onBack,
  onSave,
}: MaintenanceAddPartyViewProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const exitGuard = useMaintenanceFormExitGuard(breadcrumbs, onBack);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const isBeneficialOwnerOnly =
    allowedRoles.length === 1 && allowedRoles[0] === 'BENEFICIAL_OWNER';
  const titleKey = isControllerReplacement
    ? 'addParty.replacementTitle'
    : natureOfOwnership === 'Indirect'
      ? 'ownership.addIndirectOwner'
      : isBeneficialOwnerOnly
        ? 'ownership.addDirectOwner'
        : 'addParty.title';
  const descriptionKey = isControllerReplacement
    ? 'addParty.replacementDescription'
    : natureOfOwnership === 'Indirect'
      ? 'addParty.indirectOwnerDescription'
      : isBeneficialOwnerOnly
        ? 'addParty.beneficialOwnerDescription'
        : 'addParty.description';

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={exitGuard.guardedBreadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {t(titleKey)}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t(descriptionKey)}
        </p>
        {connectionName && natureOfOwnership ? (
          <p
            data-add-party-connection=""
            className="eb-mt-3 eb-inline-flex eb-max-w-full eb-items-center eb-gap-2 eb-rounded-full eb-border eb-bg-muted/20 eb-py-1 eb-pl-1 eb-pr-3 eb-text-xs eb-font-medium"
          >
            <MaintenanceEntityMedallion
              kind="business"
              size="sm"
              className="eb-size-6"
            />
            <span className="eb-truncate">
              {t(
                natureOfOwnership === 'Indirect'
                  ? 'addParty.connectionIndirect'
                  : 'addParty.connectionDirect',
                { name: connectionName }
              )}
            </span>
          </p>
        ) : null}
      </header>
      <div className="eb-w-full" data-maintenance-page-fill="">
        <AddRelatedPartyForm
          parentPartyId={parentPartyId}
          natureOfOwnership={natureOfOwnership}
          isControllerReplacement={isControllerReplacement}
          isBeneficialOwnerOnly={isBeneficialOwnerOnly}
          canAlsoBeBeneficialOwner={canAlsoBeBeneficialOwner}
          ownershipBusinesses={ownershipBusinesses}
          allowedRoles={allowedRoles}
          isSubmitting={isSubmitting}
          mutationError={mutationError}
          lockedCountry={lockedCountry}
          onDirtyChange={exitGuard.onDirtyChange}
          onCancel={exitGuard.requestBack}
          onSave={onSave}
        />
      </div>
      <MaintenanceUnsavedChangesDialog
        open={exitGuard.isExitConfirmationOpen}
        onKeepEditing={exitGuard.keepEditing}
        onDiscard={exitGuard.discardAndExit}
      />
    </div>
  );
}
