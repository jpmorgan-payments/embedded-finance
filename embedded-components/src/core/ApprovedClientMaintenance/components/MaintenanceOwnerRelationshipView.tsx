import { useTranslationWithTokens } from '@/i18n';
import {
  Building2Icon,
  ChevronRightIcon,
  Loader2Icon,
  UserRoundIcon,
  WaypointsIcon,
} from 'lucide-react';

import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button } from '@/components/ui';

import { usePendingAction } from '../hooks/usePendingAction';
import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { buildMaintenanceOwnershipPath } from '../utils/buildMaintenanceOwnershipPath';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

export function MaintenanceOwnerRelationshipView({
  mode,
  allowsIndirectOwnership,
  ownerName,
  clientPartyId,
  clientName,
  intermediaries,
  breadcrumbs,
  onChooseDirect,
  onChooseIntermediary,
  onAddIntermediary,
  onBack,
}: {
  mode: 'add-owner' | 'controller-owner' | 'change-owner-path';
  /** Hides ownership through a business when the eligibility matrix doesn't allow it. */
  allowsIndirectOwnership: boolean;
  ownerName?: string;
  clientPartyId: string;
  clientName: string;
  intermediaries: MaintenanceParty[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onChooseDirect: () => void | Promise<void>;
  onChooseIntermediary: (partyId: string) => void | Promise<void>;
  onAddIntermediary: () => void;
  onBack: () => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const isChangingPath = mode === 'change-owner-path';
  const showsDirectChoice = !isChangingPath;
  const showsIndirectChoice = isChangingPath || allowsIndirectOwnership;
  const hasIntermediaries = intermediaries.length > 0;
  const choice = usePendingAction();
  const titleKey = isChangingPath
    ? 'ownerRelationship.changeTitle'
    : mode === 'controller-owner'
      ? 'ownerRelationship.controllerTitle'
      : 'ownerRelationship.addTitle';
  const descriptionKey = isChangingPath
    ? hasIntermediaries
      ? 'ownerRelationship.changeDescription'
      : 'ownerRelationship.changeFirstBusinessDescription'
    : mode === 'controller-owner'
      ? 'ownerRelationship.controllerDescription'
      : 'ownerRelationship.addDescription';

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2 className="eb-text-lg eb-font-semibold">
          {t(titleKey, {
            name: ownerName ?? tString('ownerRelationship.newOwner'),
          })}
        </h2>
        <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-6 eb-text-muted-foreground">
          {t(descriptionKey, {
            name: ownerName ?? tString('ownerRelationship.newOwner'),
          })}
        </p>
      </header>

      <div className="eb-space-y-4 eb-p-5" aria-busy={choice.isPending}>
        {choice.error ? (
          <ServerErrorAlert error={choice.error as never} />
        ) : null}
        {showsDirectChoice ? (
          <button
            type="button"
            className="eb-flex eb-w-full eb-items-start eb-gap-4 eb-rounded-md eb-border eb-p-4 eb-text-left hover:eb-border-primary hover:eb-bg-accent/30 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring disabled:eb-cursor-not-allowed disabled:eb-opacity-60"
            disabled={choice.isPending}
            onClick={() => void choice.run('direct', onChooseDirect)}
          >
            <span className="eb-flex eb-size-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
              <UserRoundIcon className="eb-size-5" />
            </span>
            <span className="eb-min-w-0 eb-flex-1">
              <span className="eb-block eb-text-sm eb-font-semibold">
                {t('ownerRelationship.directTitle')}
              </span>
              <span className="eb-mt-1 eb-block eb-text-sm eb-leading-5 eb-text-muted-foreground">
                {t('ownerRelationship.directDescription')}
              </span>
              <span className="eb-mt-2 eb-block eb-text-xs eb-font-medium eb-text-primary">
                {t('ownerRelationship.directPath')}
              </span>
            </span>
            {choice.pendingKey === 'direct' ? (
              <Loader2Icon
                aria-hidden
                className="eb-mt-3 eb-size-4 eb-shrink-0 eb-animate-spin"
              />
            ) : (
              <ChevronRightIcon className="eb-mt-3 eb-size-4 eb-shrink-0" />
            )}
          </button>
        ) : null}

        {showsIndirectChoice ? (
          <section
            className={
              isChangingPath ? undefined : 'eb-rounded-md eb-border eb-p-4'
            }
          >
            {isChangingPath ? null : (
              <div className="eb-flex eb-items-start eb-gap-4">
                <span className="eb-flex eb-size-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
                  <WaypointsIcon className="eb-size-5" />
                </span>
                <div className="eb-min-w-0 eb-flex-1">
                  <h3 className="eb-text-sm eb-font-semibold">
                    {t('ownerRelationship.indirectTitle')}
                  </h3>
                  <p className="eb-mt-1 eb-text-sm eb-leading-5 eb-text-muted-foreground">
                    {t('ownerRelationship.indirectDescription')}
                  </p>
                </div>
              </div>
            )}

            {hasIntermediaries ? (
              <div className={isChangingPath ? undefined : 'eb-mt-4'}>
                <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider">
                  {t('ownerRelationship.chooseBusiness')}
                </p>
                <ul className="eb-mt-2 eb-divide-y eb-overflow-hidden eb-rounded-md eb-border">
                  {intermediaries.map((intermediary) => {
                    const ownershipPath = intermediary.id
                      ? buildMaintenanceOwnershipPath({
                          parties: intermediaries,
                          clientPartyId,
                          clientName,
                          ownerPartyId: intermediary.id,
                          fallback: tString('notProvided'),
                        })
                      : [clientName];
                    return (
                      <li key={intermediary.id}>
                        <button
                          type="button"
                          className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-3 eb-py-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring disabled:eb-cursor-not-allowed disabled:eb-opacity-60"
                          disabled={choice.isPending}
                          onClick={() => {
                            const intermediaryId = intermediary.id;
                            if (!intermediaryId) return;
                            void choice.run(intermediaryId, () =>
                              onChooseIntermediary(intermediaryId)
                            );
                          }}
                        >
                          <Building2Icon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
                          <span className="eb-min-w-0 eb-flex-1">
                            <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
                              {intermediary.organizationDetails
                                ?.organizationName ?? tString('notProvided')}
                            </span>
                            <span className="eb-mt-0.5 eb-block eb-text-xs eb-text-muted-foreground">
                              {ownershipPath.join(' › ')}
                            </span>
                          </span>
                          {choice.pendingKey === intermediary.id ? (
                            <Loader2Icon
                              aria-hidden
                              className="eb-size-4 eb-shrink-0 eb-animate-spin"
                            />
                          ) : (
                            <ChevronRightIcon className="eb-size-4 eb-shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <Button
              variant={hasIntermediaries ? 'outlineSurface' : 'default'}
              size="sm"
              className={
                isChangingPath && !hasIntermediaries ? undefined : 'eb-mt-4'
              }
              disabled={choice.isPending}
              onClick={onAddIntermediary}
            >
              <Building2Icon />
              {t('ownerRelationship.addBusiness')}
            </Button>
          </section>
        ) : null}
      </div>

      <MaintenanceViewNavigation
        backLabel={tString('form.back')}
        onBack={onBack}
        disabled={choice.isPending}
      />
    </div>
  );
}
