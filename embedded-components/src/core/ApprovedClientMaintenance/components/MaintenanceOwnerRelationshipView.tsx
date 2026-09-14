import { useTranslationWithTokens } from '@/i18n';
import {
  Building2Icon,
  ChevronRightIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react';

import { Button } from '@/components/ui';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

export function MaintenanceOwnerRelationshipView({
  mode,
  ownerName,
  intermediaries,
  breadcrumbs,
  onChooseDirect,
  onChooseIntermediary,
  onAddIntermediary,
  onBack,
}: {
  mode: 'add-owner' | 'controller-owner' | 'change-owner-path';
  ownerName?: string;
  intermediaries: MaintenanceParty[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onChooseDirect: () => void | Promise<void>;
  onChooseIntermediary: (partyId: string) => void;
  onAddIntermediary: () => void;
  onBack: () => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const isChangingPath = mode === 'change-owner-path';
  const titleKey = isChangingPath
    ? 'ownerRelationship.changeTitle'
    : mode === 'controller-owner'
      ? 'ownerRelationship.controllerTitle'
      : 'ownerRelationship.addTitle';
  const descriptionKey = isChangingPath
    ? 'ownerRelationship.changeDescription'
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

      <div className="eb-space-y-4 eb-p-5">
        {!isChangingPath ? (
          <button
            type="button"
            className="eb-flex eb-w-full eb-items-start eb-gap-4 eb-rounded-md eb-border eb-p-4 eb-text-left hover:eb-border-primary hover:eb-bg-accent/30 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring"
            onClick={() => void onChooseDirect()}
          >
            <span className="eb-flex eb-size-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
              <UserIcon className="eb-size-5" />
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
            <ChevronRightIcon className="eb-mt-3 eb-size-4 eb-shrink-0" />
          </button>
        ) : null}

        <section
          className={
            isChangingPath ? undefined : 'eb-rounded-md eb-border eb-p-4'
          }
        >
          {isChangingPath ? (
            <div>
              <h3 className="eb-text-sm eb-font-semibold">
                {t('ownerRelationship.changeExistingTitle')}
              </h3>
              <p className="eb-mt-1 eb-text-sm eb-leading-5 eb-text-muted-foreground">
                {t('ownerRelationship.changeExistingDescription', {
                  name: ownerName,
                })}
              </p>
            </div>
          ) : (
            <div className="eb-flex eb-items-start eb-gap-4">
              <span className="eb-flex eb-size-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
                <Building2Icon className="eb-size-5" />
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

          {intermediaries.length > 0 ? (
            <div className="eb-mt-4">
              <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider">
                {t(
                  isChangingPath
                    ? 'ownerRelationship.changeChooseBusiness'
                    : 'ownerRelationship.chooseBusiness'
                )}
              </p>
              <ul className="eb-mt-2 eb-divide-y eb-overflow-hidden eb-rounded-md eb-border">
                {intermediaries.map((intermediary) => (
                  <li key={intermediary.id}>
                    <button
                      type="button"
                      className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-3 eb-py-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                      onClick={() =>
                        intermediary.id && onChooseIntermediary(intermediary.id)
                      }
                    >
                      <span className="eb-min-w-0 eb-flex-1">
                        <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
                          {intermediary.organizationDetails?.organizationName ??
                            tString('notProvided')}
                        </span>
                        <span className="eb-mt-0.5 eb-block eb-text-xs eb-text-muted-foreground">
                          {t(
                            isChangingPath
                              ? 'ownerRelationship.changeResultingPath'
                              : 'ownerRelationship.resultingPath',
                            { name: ownerName }
                          )}
                        </span>
                      </span>
                      <ChevronRightIcon className="eb-size-4 eb-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button
            variant={intermediaries.length > 0 ? 'outlineSurface' : 'default'}
            size="sm"
            className="eb-mt-4"
            onClick={onAddIntermediary}
          >
            <PlusIcon />
            {t(
              isChangingPath
                ? 'ownerRelationship.changeAddBusiness'
                : 'ownerRelationship.addBusiness'
            )}
          </Button>
        </section>
      </div>

      <MaintenanceViewNavigation
        backLabel={tString('form.back')}
        onBack={onBack}
      />
    </div>
  );
}
