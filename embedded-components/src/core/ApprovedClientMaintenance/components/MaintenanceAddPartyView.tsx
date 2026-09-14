import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { useMaintenanceFormExitGuard } from '../hooks/useMaintenanceFormExitGuard';
import type {
  MaintenanceParty,
  MaintenancePartyCreateRequest,
} from '../models/maintenanceApi.types';
import { AddRelatedPartyForm } from './AddRelatedPartyForm';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceUnsavedChangesDialog } from './MaintenanceUnsavedChangesDialog';

type RelatedPartyRole = 'CONTROLLER' | 'BENEFICIAL_OWNER';

type MaintenanceAddPartyViewProps = {
  breadcrumbs: MaintenanceBreadcrumbItem[];
  parentPartyId: string;
  natureOfOwnership?: 'Direct' | 'Indirect';
  isControllerReplacement?: boolean;
  isOwnershipPathReplacement?: boolean;
  initialParty?: MaintenanceParty;
  canAlsoBeBeneficialOwner?: boolean;
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
  isControllerReplacement,
  isOwnershipPathReplacement,
  initialParty,
  canAlsoBeBeneficialOwner,
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
    : isOwnershipPathReplacement
      ? 'addParty.ownershipPathTitle'
      : natureOfOwnership === 'Indirect'
        ? 'ownership.addIndirectOwner'
        : isBeneficialOwnerOnly
          ? 'ownership.addDirectOwner'
          : 'addParty.title';
  const descriptionKey = isControllerReplacement
    ? 'addParty.replacementDescription'
    : isOwnershipPathReplacement
      ? 'addParty.ownershipPathDescription'
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
      </header>
      <div className="eb-w-full">
        <AddRelatedPartyForm
          parentPartyId={parentPartyId}
          natureOfOwnership={natureOfOwnership}
          isControllerReplacement={isControllerReplacement}
          isOwnershipPathReplacement={isOwnershipPathReplacement}
          initialParty={initialParty}
          isBeneficialOwnerOnly={isBeneficialOwnerOnly}
          canAlsoBeBeneficialOwner={canAlsoBeBeneficialOwner}
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
