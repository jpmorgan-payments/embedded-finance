import { useTranslationWithTokens } from '@/i18n';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceOwnershipTree } from './MaintenanceOwnershipTree';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

export function MaintenanceOwnershipView({
  clientPartyId,
  clientName,
  parties,
  breadcrumbs,
  canAddDirectOwner,
  ownerLimitReached,
  canManageIndirectOwnership,
  onAddBeneficialOwner,
  onAddIntermediary,
  onSelectBusiness,
  onChangeOwnerPath,
  onSelectOwner,
  backLabel,
  onBack,
}: {
  clientPartyId: string;
  clientName: string;
  parties: MaintenanceParty[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  canAddDirectOwner: boolean;
  ownerLimitReached: boolean;
  canManageIndirectOwnership: boolean;
  onAddBeneficialOwner: (parentPartyId: string) => void;
  onAddIntermediary: (parentPartyId: string) => void;
  onSelectBusiness: (partyId: string) => void;
  onChangeOwnerPath: (ownerId: string) => void;
  onSelectOwner: (partyId: string) => void;
  backLabel: string;
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
        <h2 className="eb-text-lg eb-font-semibold">{t('ownership.title')}</h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('ownership.description')}
        </p>
      </header>
      <section
        className="eb-border-b eb-p-5"
        aria-label={tString('ownership.title')}
      >
        <MaintenanceOwnershipTree
          clientPartyId={clientPartyId}
          clientName={clientName}
          parties={parties}
          canManage
          canAddBeneficialOwner={canAddDirectOwner}
          canAddIntermediary={canManageIndirectOwnership}
          ownerLimitReached={ownerLimitReached}
          onSelectOwner={onSelectOwner}
          onSelectBusiness={onSelectBusiness}
          onAddBeneficialOwner={onAddBeneficialOwner}
          onAddIntermediary={onAddIntermediary}
          onInsertIntermediary={onChangeOwnerPath}
        />
      </section>
      <MaintenanceViewNavigation backLabel={backLabel} onBack={onBack} />
    </div>
  );
}
