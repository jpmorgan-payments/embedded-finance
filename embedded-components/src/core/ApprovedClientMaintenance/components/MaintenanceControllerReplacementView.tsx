import { useTranslationWithTokens } from '@/i18n';
import { ChevronRightIcon, UserPlusIcon } from 'lucide-react';

import { Button } from '@/components/ui';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { getMaintenancePartyIdentity } from '../utils/maintenanceDisplay';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';
import { PartyAvatar } from './PartyAvatar';

export function MaintenanceControllerReplacementView({
  candidates,
  breadcrumbs,
  isSubmitting,
  onSelectCandidate,
  onAddNew,
  onBack,
}: {
  candidates: MaintenanceParty[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  isSubmitting: boolean;
  onSelectCandidate: (partyId: string) => void | Promise<void>;
  onAddNew: () => void;
  onBack: () => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2 className="eb-text-lg eb-font-semibold">
          {t('controllerReplacement.title')}
        </h2>
        <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-text-muted-foreground">
          {t('controllerReplacement.description')}
        </p>
      </header>

      <section className="eb-p-5">
        {candidates.length > 0 ? (
          <>
            <h3 className="eb-text-sm eb-font-semibold">
              {t('controllerReplacement.existingTitle')}
            </h3>
            <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
              {t('controllerReplacement.existingDescription')}
            </p>
            <ul className="eb-mt-3 eb-divide-y eb-overflow-hidden eb-rounded-md eb-border">
              {candidates.map((candidate) => {
                const identity = getMaintenancePartyIdentity(
                  candidate,
                  undefined,
                  tString('notProvided')
                );
                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-4 eb-py-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                      disabled={isSubmitting}
                      onClick={() =>
                        candidate.id && void onSelectCandidate(candidate.id)
                      }
                    >
                      <PartyAvatar
                        name={identity.displayName}
                        className="eb-size-9 eb-text-xs"
                      />
                      <span className="eb-min-w-0 eb-flex-1">
                        <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
                          {identity.displayName}
                        </span>
                        <span className="eb-mt-0.5 eb-block eb-text-xs eb-text-muted-foreground">
                          {t('controllerReplacement.selectDescription')}
                        </span>
                      </span>
                      <ChevronRightIcon className="eb-size-4 eb-shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="eb-rounded-md eb-border eb-border-dashed eb-p-4">
            <p className="eb-text-sm eb-font-medium">
              {t('controllerReplacement.emptyTitle')}
            </p>
            <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
              {t('controllerReplacement.emptyDescription')}
            </p>
          </div>
        )}

        <div className="eb-mt-5 eb-border-t eb-pt-4">
          <Button onClick={onAddNew} disabled={isSubmitting}>
            <UserPlusIcon />
            {t('controllerReplacement.addNew')}
          </Button>
        </div>
      </section>

      <MaintenanceViewNavigation
        backLabel={tString('form.back')}
        onBack={onBack}
      />
    </div>
  );
}
