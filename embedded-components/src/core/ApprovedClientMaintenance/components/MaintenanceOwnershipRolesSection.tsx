import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightLeftIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  NetworkIcon,
  UserRoundCogIcon,
  UserRoundIcon,
  UserRoundPlusIcon,
  WaypointsIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import type { PartyMaintenanceEntityTask } from '../utils/buildMaintenanceEntityTasks';
import {
  getMaintenanceRoleState,
  type MaintenanceRoleState,
} from '../utils/getMaintenanceRoleState';
import { MaintenanceOwnershipChain } from './MaintenanceOwnershipChain';
import { MaintenanceRoleCard } from './MaintenanceRoleCard';

function RoleStatus({
  state,
  pendingAdditionLabel,
  pendingRemovalLabel,
}: {
  state: MaintenanceRoleState;
  pendingAdditionLabel: string;
  pendingRemovalLabel: string;
}) {
  if (state === 'active' || state === 'absent') return null;

  const isPendingAddition = state === 'pending-addition';
  const Icon = isPendingAddition ? CircleDashedIcon : CircleMinusIcon;

  return (
    <span
      className={cn(
        'eb-inline-flex eb-shrink-0 eb-items-center eb-gap-1.5 eb-rounded-full eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium',
        isPendingAddition
          ? 'eb-bg-informative-accent eb-text-informative'
          : 'eb-bg-destructive-accent eb-text-destructive'
      )}
    >
      <Icon className="eb-size-3.5" aria-hidden="true" />
      {isPendingAddition ? pendingAdditionLabel : pendingRemovalLabel}
    </span>
  );
}

export function MaintenanceOwnershipRolesSection({
  task,
  canAddBeneficialOwnerRole,
  canManageOwnership,
  onAddBeneficialOwnerRole,
  onManageOwnership,
  onInsertIntermediary,
  onChangeConnection,
  ownershipPath,
  mode = 'approved-party',
}: {
  task: PartyMaintenanceEntityTask;
  canAddBeneficialOwnerRole: boolean;
  canManageOwnership: boolean;
  onAddBeneficialOwnerRole: () => void;
  onManageOwnership?: () => void;
  onInsertIntermediary: () => void;
  onChangeConnection?: () => void;
  ownershipPath: string[];
  mode?: 'approved-party' | 'pending-party';
}) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const isPendingParty = mode === 'pending-party';
  const proposedRoles = task.proposedParty.roles ?? task.party.roles ?? [];
  const approvedRoles = isPendingParty
    ? proposedRoles
    : (task.party.roles ?? []);
  const controllerState = getMaintenanceRoleState(
    approvedRoles,
    proposedRoles,
    'CONTROLLER'
  );
  const ownerState = getMaintenanceRoleState(
    approvedRoles,
    proposedRoles,
    'BENEFICIAL_OWNER'
  );
  const showsController = controllerState !== 'absent';
  const showsBeneficialOwner = ownerState !== 'absent';
  const hasIntermediaryInPath = ownershipPath.length > 2;
  const showChangeToIndirect =
    canManageOwnership &&
    ownerState !== 'pending-removal' &&
    !hasIntermediaryInPath;
  const showViewStructure =
    Boolean(onManageOwnership) && ownershipPath.length > 1;
  const roleStateNote = (state: MaintenanceRoleState) =>
    state === 'active'
      ? undefined
      : t(
          isPendingParty
            ? 'roleChange.pendingPartyRoleDescription'
            : state === 'pending-addition'
              ? 'roleChange.pendingAdditionDescription'
              : 'roleChange.pendingRemovalDescription'
        );
  const roleStatus = (state: MaintenanceRoleState) => (
    <RoleStatus
      state={state}
      pendingAdditionLabel={tString('roleChange.pendingAddition')}
      pendingRemovalLabel={tString('roleChange.pendingRemoval')}
    />
  );

  return (
    <section
      aria-labelledby="entity-ownership-roles-heading"
      className="eb-grid eb-gap-x-8 eb-gap-y-4 eb-border-t eb-bg-muted/20 eb-px-4 eb-py-5 @[48rem]:eb-grid-cols-[minmax(8rem,1fr)_2.5fr]"
    >
      <div>
        <h3
          id="entity-ownership-roles-heading"
          className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
        >
          {t('roleChange.sectionTitle')}
        </h3>
      </div>
      <div className="eb-space-y-3">
        {showsController ? (
          <MaintenanceRoleCard
            partyRole="CONTROLLER"
            state={controllerState}
            icon={<UserRoundCogIcon />}
            title={tString([
              'common:partyRoles.CONTROLLER',
            ] as unknown as TemplateStringsArray)}
            status={roleStatus(controllerState)}
            description={t('roleChange.controllerDescription')}
            stateNote={roleStateNote(controllerState)}
            actions={
              canAddBeneficialOwnerRole ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  className="eb-w-full @[40rem]:eb-w-auto"
                  onClick={onAddBeneficialOwnerRole}
                >
                  <UserRoundPlusIcon />
                  {t('roleChange.addOwner')}
                </Button>
              ) : null
            }
          />
        ) : null}
        {showsBeneficialOwner ? (
          <MaintenanceRoleCard
            partyRole="BENEFICIAL_OWNER"
            state={ownerState}
            icon={<UserRoundIcon />}
            title={t(
              hasIntermediaryInPath
                ? 'roleChange.indirectOwnerTitle'
                : 'roleChange.directOwnerTitle'
            )}
            status={roleStatus(ownerState)}
            description={t(
              hasIntermediaryInPath
                ? 'roleChange.indirectOwnerDescription'
                : 'roleChange.directOwnerDescription'
            )}
            stateNote={roleStateNote(ownerState)}
            detail={
              ownershipPath.length > 1 ? (
                <>
                  <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                    {t('ownership.connectionChainTitle')}
                  </p>
                  <div className="eb-mt-2.5">
                    <MaintenanceOwnershipChain
                      steps={ownershipPath}
                      finalLabel={tString(
                        'ownership.connectionChainThisPerson'
                      )}
                    />
                  </div>
                </>
              ) : null
            }
            actions={
              showChangeToIndirect ||
              onChangeConnection ||
              showViewStructure ? (
                <>
                  {showChangeToIndirect ? (
                    <Button
                      variant="outlineSurface"
                      size="sm"
                      className="eb-w-full @[40rem]:eb-w-auto"
                      onClick={onInsertIntermediary}
                    >
                      <WaypointsIcon />
                      {t('roleChange.changeToIndirect')}
                    </Button>
                  ) : null}
                  {onChangeConnection ? (
                    <Button
                      variant="outlineSurface"
                      size="sm"
                      className="eb-w-full @[40rem]:eb-w-auto"
                      onClick={onChangeConnection}
                    >
                      <ArrowRightLeftIcon />
                      {t('ownershipEditor.moveAction')}
                    </Button>
                  ) : null}
                  {showViewStructure ? (
                    <Button
                      variant="outlineSurface"
                      size="sm"
                      className="eb-w-full @[40rem]:eb-w-auto"
                      onClick={onManageOwnership}
                    >
                      <NetworkIcon />
                      {t('ownership.viewStructure')}
                    </Button>
                  ) : null}
                </>
              ) : null
            }
          />
        ) : null}
        {!showsController && !showsBeneficialOwner ? (
          <p className="eb-rounded-md eb-border eb-border-dashed eb-border-border eb-px-4 eb-py-3 eb-text-sm eb-text-muted-foreground">
            {t('noRoles')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
