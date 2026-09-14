import { useTranslationWithTokens } from '@/i18n';
import {
  CircleDashedIcon,
  CircleMinusIcon,
  NetworkIcon,
  Trash2Icon,
  UserRoundCogIcon,
  UserRoundPlusIcon,
} from 'lucide-react';

import { useLocale } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import type { PartyMaintenanceEntityTask } from '../utils/buildMaintenanceEntityTasks';
import {
  getMaintenanceRoleState,
  type MaintenanceRoleState,
} from '../utils/getMaintenanceRoleState';

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
        'eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-medium',
        isPendingAddition ? 'eb-text-informative' : 'eb-text-warning-foreground'
      )}
    >
      <Icon className="eb-size-3.5" aria-hidden="true" />
      {isPendingAddition ? pendingAdditionLabel : pendingRemovalLabel}
    </span>
  );
}

export function MaintenanceOwnershipRolesSection({
  task,
  canRemove,
  canAddBeneficialOwnerRole,
  canDiscardPendingOwnerChanges,
  canManageOwnership,
  onRemove,
  onAddBeneficialOwnerRole,
  onDiscardPartyChanges,
  onManageOwnership,
  onInsertIntermediary,
  ownershipPath,
  mode = 'approved-party',
}: {
  task: PartyMaintenanceEntityTask;
  canRemove: boolean;
  canAddBeneficialOwnerRole: boolean;
  canDiscardPendingOwnerChanges: boolean;
  canManageOwnership: boolean;
  onRemove: () => void;
  onAddBeneficialOwnerRole: () => void;
  onDiscardPartyChanges: () => void;
  onManageOwnership: () => void;
  onInsertIntermediary: () => void;
  ownershipPath: string[];
  mode?: 'approved-party' | 'pending-party';
}) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const locale = useLocale();
  const isPendingParty = mode === 'pending-party';
  const approvedRoles = isPendingParty ? [] : (task.party.roles ?? []);
  const proposedRoles = task.proposedParty.roles ?? task.party.roles ?? [];
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
  const isController = controllerState === 'active';
  const hasIntermediaryInPath = ownershipPath.length > 2;
  const intermediaryNames = ownershipPath.slice(1, -1);
  const intermediaryList = new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  }).format(intermediaryNames);

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
          {t(
            isPendingParty
              ? 'roleChange.pendingPartySectionTitle'
              : 'roleChange.sectionTitle'
          )}
        </h3>
      </div>
      <div className="eb-space-y-3">
        {showsController ? (
          <div
            data-role="CONTROLLER"
            data-role-state={controllerState}
            className={cn(
              'eb-overflow-hidden eb-rounded-md eb-border eb-bg-background',
              controllerState === 'pending-addition' &&
                'eb-border-informative/70 eb-bg-informative-accent/40',
              controllerState === 'pending-removal' &&
                'eb-border-warning/60 eb-bg-warning-accent/40'
            )}
          >
            <div className="eb-px-4 eb-py-3">
              <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2">
                <p className="eb-text-sm eb-font-medium">
                  {tString([
                    'common:partyRoles.CONTROLLER',
                  ] as unknown as TemplateStringsArray)}
                </p>
                <RoleStatus
                  state={controllerState}
                  pendingAdditionLabel={tString('roleChange.pendingAddition')}
                  pendingRemovalLabel={tString('roleChange.pendingRemoval')}
                />
              </div>
              <p className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
                {t('roleChange.controllerDescription')}
              </p>
              {controllerState !== 'active' ? (
                <p className="eb-mt-2 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                  {t(
                    isPendingParty
                      ? 'roleChange.pendingPartyRoleDescription'
                      : controllerState === 'pending-addition'
                        ? 'roleChange.pendingAdditionDescription'
                        : 'roleChange.pendingRemovalDescription'
                  )}
                </p>
              ) : null}
            </div>
            {canAddBeneficialOwnerRole || canRemove ? (
              <div className="eb-flex eb-flex-col eb-gap-2 eb-border-t eb-bg-muted/10 eb-px-4 eb-py-3 @[40rem]:eb-flex-row @[40rem]:eb-justify-end">
                {canAddBeneficialOwnerRole ? (
                  <Button
                    variant="outlineSurface"
                    size="sm"
                    className="eb-w-full @[40rem]:eb-w-auto"
                    onClick={onAddBeneficialOwnerRole}
                  >
                    <UserRoundPlusIcon />
                    {t('roleChange.addOwner')}
                  </Button>
                ) : null}
                {canRemove ? (
                  <Button
                    variant="outlineSurface"
                    size="sm"
                    className="eb-w-full @[40rem]:eb-w-auto"
                    onClick={onRemove}
                  >
                    <UserRoundCogIcon />
                    {t('removeParty.replaceController')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {showsBeneficialOwner ? (
          <div
            data-role="BENEFICIAL_OWNER"
            data-role-state={ownerState}
            className={cn(
              'eb-overflow-hidden eb-rounded-md eb-border eb-bg-background',
              ownerState === 'pending-addition' &&
                'eb-border-informative/70 eb-bg-informative-accent/40',
              ownerState === 'pending-removal' &&
                'eb-border-warning/60 eb-bg-warning-accent/40'
            )}
          >
            <div className="eb-px-4 eb-py-3">
              <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2">
                <p className="eb-text-sm eb-font-medium">
                  {t(
                    hasIntermediaryInPath
                      ? 'roleChange.indirectOwnerTitle'
                      : 'roleChange.directOwnerTitle'
                  )}
                </p>
                <RoleStatus
                  state={ownerState}
                  pendingAdditionLabel={tString('roleChange.pendingAddition')}
                  pendingRemovalLabel={tString('roleChange.pendingRemoval')}
                />
              </div>
              <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                {t(
                  hasIntermediaryInPath
                    ? 'roleChange.indirectOwnerDescription'
                    : 'roleChange.directOwnerDescription'
                )}
              </p>
              {ownerState !== 'active' ? (
                <div className="eb-mt-3 eb-flex eb-flex-col eb-gap-3 @[40rem]:eb-flex-row @[40rem]:eb-items-end @[40rem]:eb-justify-between">
                  <p className="eb-max-w-2xl eb-text-xs eb-leading-5 eb-text-muted-foreground">
                    {t(
                      isPendingParty
                        ? 'roleChange.pendingPartyRoleDescription'
                        : ownerState === 'pending-addition'
                          ? 'roleChange.pendingAdditionDescription'
                          : 'roleChange.pendingRemovalDescription'
                    )}
                  </p>
                  {canDiscardPendingOwnerChanges ? (
                    <Button
                      variant="outlineSurface"
                      size="sm"
                      className="eb-w-full eb-shrink-0 eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive @[40rem]:eb-w-auto"
                      onClick={onDiscardPartyChanges}
                    >
                      <Trash2Icon />
                      {t('roleChange.discardPartyDraft')}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {ownerState !== 'pending-removal' &&
            (hasIntermediaryInPath || canManageOwnership) ? (
              <div className="eb-border-t eb-bg-muted/15 eb-px-4 eb-py-3">
                <div className="eb-grid eb-gap-3 @[40rem]:eb-grid-cols-[minmax(0,1fr)_auto] @[40rem]:eb-items-end">
                  <div>
                    <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                      {t(
                        hasIntermediaryInPath
                          ? 'roleChange.indirectRelationshipTitle'
                          : 'roleChange.directRelationshipTitle'
                      )}
                    </p>
                    <p className="eb-mt-1 eb-max-w-2xl eb-text-xs eb-leading-5 eb-text-muted-foreground">
                      {hasIntermediaryInPath
                        ? t('roleChange.indirectRelationshipDescription', {
                            businesses:
                              intermediaryList ||
                              tString('ownership.intermediaryOwner'),
                          })
                        : t('roleChange.directRelationshipDescription')}
                    </p>
                  </div>
                  {canManageOwnership ? (
                    <div>
                      {hasIntermediaryInPath ? (
                        <Button
                          variant="outlineSurface"
                          size="sm"
                          className="eb-w-full @[40rem]:eb-w-auto"
                          onClick={onManageOwnership}
                        >
                          <NetworkIcon />
                          {t('roleChange.reviewOwnershipPath')}
                        </Button>
                      ) : (
                        <Button
                          variant="outlineSurface"
                          size="sm"
                          className="eb-w-full @[40rem]:eb-w-auto"
                          onClick={onInsertIntermediary}
                        >
                          <NetworkIcon />
                          {t('roleChange.changeToIndirect')}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {!isController && canRemove && ownerState === 'active' ? (
              <div className="eb-flex eb-flex-col eb-gap-2 eb-border-t eb-bg-muted/10 eb-px-4 eb-py-3 @[40rem]:eb-flex-row @[40rem]:eb-justify-end">
                {!isController && canRemove && ownerState === 'active' ? (
                  <Button
                    variant="outlineSurface"
                    size="sm"
                    className="eb-w-full eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive @[40rem]:eb-w-auto"
                    onClick={onRemove}
                  >
                    <Trash2Icon />
                    {t('removeParty.action')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {!showsController && !showsBeneficialOwner ? (
          <p className="eb-px-4 eb-py-3 eb-text-sm eb-text-muted-foreground">
            {t('noRoles')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
