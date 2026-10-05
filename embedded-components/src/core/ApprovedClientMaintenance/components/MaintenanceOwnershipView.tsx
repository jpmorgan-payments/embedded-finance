import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightLeftIcon,
  PencilIcon,
  Trash2Icon,
  Undo2Icon,
  UserRoundCogIcon,
  WaypointsIcon,
} from 'lucide-react';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import type { MaintenancePartyStatus } from '../utils/getMaintenancePartyStatus';
import type { OwnershipNodeChange } from '../utils/getOwnershipChanges';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import {
  MaintenanceOwnershipTree,
  type OwnershipNodeAction,
} from './MaintenanceOwnershipTree';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

export function MaintenanceOwnershipView({
  clientPartyId,
  clientName,
  parties,
  nodeChanges,
  previousParentIds,
  getPartyStatus,
  canCancelPendingRemoval,
  onCancelPendingRemoval,
  breadcrumbs,
  canAddOwner,
  ownerLimitReached,
  canManageIndirectOwnership,
  onAddBeneficialOwner,
  onAddIntermediary,
  onSelectBusiness,
  onSelectOwner,
  onMoveParty,
  onInsertIntermediary,
  canMoveParty,
  canRemoveIntermediary,
  canDiscardPendingParty,
  onRequestRemoveIntermediary,
  onDiscardPendingParty,
  canEditParty,
  onEditParty,
  canRemovePerson,
  removeRequiresControllerReplacement,
  onRemovePerson,
  backLabel,
  onBack,
}: {
  clientPartyId: string;
  clientName: string;
  parties: MaintenanceParty[];
  nodeChanges: ReadonlyMap<string, OwnershipNodeChange>;
  previousParentIds: ReadonlyMap<string, string>;
  getPartyStatus: (partyId: string) => MaintenancePartyStatus | undefined;
  canCancelPendingRemoval: boolean;
  onCancelPendingRemoval: (partyId: string) => void;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  /** Whether the root Add beneficial owner action leads anywhere (direct or indirect). */
  canAddOwner: boolean;
  ownerLimitReached: boolean;
  canManageIndirectOwnership: boolean;
  onAddBeneficialOwner: (parentPartyId: string) => void;
  onAddIntermediary: (parentPartyId: string) => void;
  onSelectBusiness: (partyId: string) => void;
  onSelectOwner: (partyId: string) => void;
  onMoveParty: (partyId: string) => void;
  onInsertIntermediary: (partyId: string) => void;
  canMoveParty: (partyId: string) => boolean;
  canRemoveIntermediary: (partyId: string) => boolean;
  canDiscardPendingParty: (partyId: string) => boolean;
  onRequestRemoveIntermediary: (partyId: string) => void;
  onDiscardPendingParty: (partyId: string) => void;
  canEditParty: (partyId: string) => boolean;
  onEditParty: (partyId: string) => void;
  canRemovePerson: (partyId: string) => boolean;
  removeRequiresControllerReplacement: (partyId: string) => boolean;
  onRemovePerson: (partyId: string) => void;
  backLabel: string;
  onBack: () => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );

  const getPartyActions = (partyId: string): OwnershipNodeAction[] => {
    const party = parties.find((candidate) => candidate.id === partyId);
    if (!party) return [];
    if (nodeChanges.get(partyId) === 'removed') {
      return canCancelPendingRemoval
        ? [
            {
              id: 'cancel-removal',
              label: tString('pendingRemoval.cancel'),
              description: tString('pendingRemoval.cancelDescription'),
              icon: <Undo2Icon />,
              onSelect: () => onCancelPendingRemoval(partyId),
            },
          ]
        : [];
    }
    const isIntermediary = Boolean(party.roles?.includes('INTERMEDIARY_OWNER'));
    const ownsDirectly =
      !party.parentPartyId || party.parentPartyId === clientPartyId;
    const actions: OwnershipNodeAction[] = [];
    const isPendingAddition = nodeChanges.get(partyId) === 'added';

    if (canEditParty(partyId)) {
      actions.push({
        id: 'edit',
        label: tString(
          isPendingAddition ? 'pendingAddition.edit' : 'entity.editDetails'
        ),
        description: tString(
          isIntermediary
            ? 'ownershipEditor.editBusinessDescription'
            : 'ownershipEditor.editPersonDescription'
        ),
        icon: <PencilIcon />,
        onSelect: () => onEditParty(partyId),
      });
    }
    if (canMoveParty(partyId)) {
      actions.push({
        id: 'move',
        label: tString('ownershipEditor.moveAction'),
        description: tString('ownershipEditor.moveActionDescription'),
        icon: <ArrowRightLeftIcon />,
        onSelect: () => onMoveParty(partyId),
      });
    }
    if (
      !isIntermediary &&
      canManageIndirectOwnership &&
      ownsDirectly &&
      canEditParty(partyId)
    ) {
      actions.push({
        id: 'insert-business',
        label: tString('ownership.insertBusinessForOwner'),
        description: tString('ownershipEditor.insertBusinessDescription'),
        icon: <WaypointsIcon />,
        onSelect: () => onInsertIntermediary(partyId),
      });
    }
    if (!isIntermediary && canRemovePerson(partyId)) {
      const replacesController = removeRequiresControllerReplacement(partyId);
      actions.push({
        id: 'remove-person',
        label: tString(
          replacesController
            ? 'removeParty.replaceController'
            : 'removeParty.action'
        ),
        description: tString(
          replacesController
            ? 'ownershipEditor.replaceControllerDescription'
            : 'ownershipEditor.removePersonDescription'
        ),
        icon: replacesController ? <UserRoundCogIcon /> : <Trash2Icon />,
        destructive: !replacesController,
        onSelect: () => onRemovePerson(partyId),
      });
    }
    if (isIntermediary && canRemoveIntermediary(partyId)) {
      actions.push({
        id: 'remove-intermediary',
        label: tString('removeIntermediary.action'),
        description: tString('ownershipEditor.removeDescription'),
        icon: <Trash2Icon />,
        destructive: true,
        onSelect: () => onRequestRemoveIntermediary(partyId),
      });
    }
    if (canDiscardPendingParty(partyId)) {
      actions.push({
        id: 'discard-pending',
        label: tString('pendingAddition.discard'),
        description: tString('ownershipEditor.discardPendingDescription'),
        icon: <Undo2Icon />,
        destructive: true,
        onSelect: () => onDiscardPendingParty(partyId),
      });
    }
    return actions;
  };

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
        className="eb-border-b eb-p-4 @[40rem]:eb-p-5"
        aria-label={tString('ownership.title')}
      >
        <MaintenanceOwnershipTree
          clientPartyId={clientPartyId}
          clientName={clientName}
          parties={parties}
          nodeChanges={nodeChanges}
          previousParentIds={previousParentIds}
          getPartyStatus={getPartyStatus}
          canAddBeneficialOwner={canAddOwner}
          canAddIntermediary={canManageIndirectOwnership}
          ownerLimitReached={ownerLimitReached}
          getPartyActions={getPartyActions}
          onSelectOwner={onSelectOwner}
          onSelectBusiness={onSelectBusiness}
          onAddBeneficialOwner={onAddBeneficialOwner}
          onAddIntermediary={onAddIntermediary}
        />
      </section>
      <MaintenanceViewNavigation backLabel={backLabel} onBack={onBack} />
    </div>
  );
}
