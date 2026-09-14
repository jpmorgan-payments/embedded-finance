import { useTranslationWithTokens } from '@/i18n';
import { ArrowRightIcon, Building2Icon } from 'lucide-react';

import { useMaintenanceFormExitGuard } from '../hooks/useMaintenanceFormExitGuard';
import type { MaintenancePartyCreateRequest } from '../models/maintenanceApi.types';
import { AddIntermediaryOwnerForm } from './AddIntermediaryOwnerForm';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceUnsavedChangesDialog } from './MaintenanceUnsavedChangesDialog';

export function MaintenanceAddIntermediaryView({
  breadcrumbs,
  parentPartyId,
  parentIsClient,
  isOwnershipPathInsertion,
  pathOwnerName,
  isSubmitting,
  error,
  onBack,
  onSave,
}: {
  breadcrumbs: MaintenanceBreadcrumbItem[];
  parentPartyId: string;
  parentIsClient: boolean;
  isOwnershipPathInsertion?: boolean;
  pathOwnerName?: string;
  isSubmitting: boolean;
  error?: unknown;
  onBack: () => void;
  onSave: (request: MaintenancePartyCreateRequest) => Promise<void>;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const exitGuard = useMaintenanceFormExitGuard(breadcrumbs, onBack);
  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={exitGuard.guardedBreadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <div className="eb-flex eb-items-center eb-gap-2">
          <Building2Icon
            className="eb-size-5 eb-shrink-0 eb-text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="eb-text-lg eb-font-semibold">
            {t(
              isOwnershipPathInsertion
                ? 'ownership.insertIntermediary'
                : 'ownership.addIntermediary'
            )}
          </h2>
        </div>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t(
            isOwnershipPathInsertion
              ? 'ownership.insertIntermediaryDescription'
              : 'ownership.intermediaryCaption'
          )}
        </p>
      </header>
      {isOwnershipPathInsertion ? (
        <section className="eb-border-b eb-bg-informative-accent/40 eb-px-4 eb-py-4">
          <h3 className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-informative">
            {t('ownership.pathPreviewTitle')}
          </h3>
          <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
            {t('ownership.pathPreviewDescription')}
          </p>
          <div className="eb-mt-3 eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
            <span className="eb-inline-flex eb-items-center eb-gap-1.5">
              {t('ownership.clientRoot')}
            </span>
            <ArrowRightIcon className="eb-size-4 eb-text-muted-foreground" />
            <span className="eb-inline-flex eb-items-center eb-gap-1.5 eb-text-informative">
              {t('ownership.newIntermediary')}
            </span>
            <ArrowRightIcon className="eb-size-4 eb-text-muted-foreground" />
            <span className="eb-inline-flex eb-items-center eb-gap-1.5">
              {pathOwnerName ?? t('ownerRelationship.newOwner')}
            </span>
          </div>
        </section>
      ) : null}
      <div className="eb-w-full">
        <AddIntermediaryOwnerForm
          parentPartyId={parentPartyId}
          parentIsClient={parentIsClient}
          isSubmitting={isSubmitting}
          error={error}
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
