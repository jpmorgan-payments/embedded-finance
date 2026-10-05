import type { MaintenanceParty } from '../models/maintenanceApi.types';
import type {
  MaintenanceEntityTasks,
  PartyMaintenanceEntityTask,
} from './buildMaintenanceEntityTasks';
import type {
  MaintenanceProjection,
  PartyChange,
  PartyFieldChange,
  ProductChange,
} from './buildMaintenanceProjection';
import { getControllerReplacement } from './getControllerReplacement';
import { getVisibleFieldChanges } from './getVisibleFieldChanges';

export type MaintenanceDiscardTarget =
  | { scope: 'all' }
  | { scope: 'party' | 'pending-addition' | 'organization'; partyId: string };

export type MaintenanceDiscardEntry = {
  id: string;
  entityKind: 'person' | 'business';
  isOrganization: boolean;
  party: MaintenanceParty;
  proposedParty: MaintenanceParty;
  change?: PartyChange;
  fieldChanges: PartyFieldChange[];
};

export type MaintenanceDiscardContent =
  | {
      kind: 'all';
      products: ProductChange[];
      added: MaintenanceDiscardEntry[];
      updated: MaintenanceDiscardEntry[];
      removed: MaintenanceDiscardEntry[];
    }
  | {
      kind: 'edit' | 'addition' | 'removal';
      entry: MaintenanceDiscardEntry;
      /** Whether anything else remains in the request after this discard. */
      hasOtherChanges: boolean;
    }
  | {
      /** Undoing either side of a controller hand-over undoes both sides. */
      kind: 'controller-replacement';
      outgoing: MaintenanceDiscardEntry;
      incoming: MaintenanceDiscardEntry;
      incomingIsAddition: boolean;
      hasOtherChanges: boolean;
    };

const toEntry = (
  task: PartyMaintenanceEntityTask
): MaintenanceDiscardEntry => ({
  id: task.partyId,
  entityKind: task.proposedParty.roles?.includes('INTERMEDIARY_OWNER')
    ? 'business'
    : 'person',
  isOrganization: false,
  party: task.party,
  proposedParty: task.proposedParty,
  change: task.change,
  fieldChanges: getVisibleFieldChanges(task.change?.fieldChanges ?? []),
});

/** What a discard will drop, shaped like the review page so both read the same. */
export function buildMaintenanceDiscardContent(
  target: MaintenanceDiscardTarget,
  projection: MaintenanceProjection,
  entityTasks: MaintenanceEntityTasks
): MaintenanceDiscardContent | undefined {
  const organizationChange = entityTasks.organization.change;
  const organizationEntry: MaintenanceDiscardEntry | undefined =
    entityTasks.organization.party && organizationChange
      ? {
          id: organizationChange.partyId,
          entityKind: 'business',
          isOrganization: true,
          party: entityTasks.organization.party,
          proposedParty: entityTasks.organization.party,
          change: organizationChange,
          fieldChanges: getVisibleFieldChanges(organizationChange.fieldChanges),
        }
      : undefined;
  const changedTasks = [
    ...entityTasks.parties,
    ...entityTasks.intermediaryOrganizations,
  ].filter((task) => task.change);

  if (target.scope === 'all') {
    const isRemoval = (task: PartyMaintenanceEntityTask) =>
      !task.isPendingAddition && Boolean(task.change?.removesParty);
    return {
      kind: 'all',
      products: projection.productChanges,
      added: changedTasks.filter((task) => task.isPendingAddition).map(toEntry),
      updated: [
        ...(organizationEntry ? [organizationEntry] : []),
        ...changedTasks
          .filter((task) => !task.isPendingAddition && !isRemoval(task))
          .map(toEntry)
          .filter((entry) => entry.fieldChanges.length > 0),
      ],
      removed: changedTasks.filter(isRemoval).map(toEntry),
    };
  }

  const hasOtherChanges =
    projection.productChanges.length + projection.partyChanges.length > 1;

  if (target.scope === 'organization') {
    return organizationEntry
      ? { kind: 'edit', entry: organizationEntry, hasOtherChanges }
      : undefined;
  }

  const task = changedTasks.find(
    (candidate) => candidate.partyId === target.partyId
  );
  if (!task) return undefined;

  const replacement = getControllerReplacement(projection);
  if (
    replacement &&
    (replacement.outgoingPartyId === task.partyId ||
      replacement.incomingPartyId === task.partyId)
  ) {
    const outgoingTask = changedTasks.find(
      (candidate) => candidate.partyId === replacement.outgoingPartyId
    );
    const incomingTask = changedTasks.find(
      (candidate) => candidate.partyId === replacement.incomingPartyId
    );
    if (outgoingTask && incomingTask) {
      return {
        kind: 'controller-replacement',
        outgoing: toEntry(outgoingTask),
        incoming: toEntry(incomingTask),
        incomingIsAddition: incomingTask.isPendingAddition,
        hasOtherChanges:
          projection.productChanges.length + projection.partyChanges.length > 2,
      };
    }
  }

  return {
    kind:
      target.scope === 'pending-addition' || task.isPendingAddition
        ? 'addition'
        : task.change?.removesParty
          ? 'removal'
          : 'edit',
    entry: toEntry(task),
    hasOtherChanges,
  };
}
