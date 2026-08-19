import { useEffect, useState, type ReactNode } from 'react';
import { TransWithTokens, useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react';
import { useForm, useFormState } from 'react-hook-form';

import {
  getSmbdoGetClientQueryKey,
  usePostParty,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import {
  ClientResponse,
  PartyResponse,
  Role,
} from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { LearnMorePopoverTrigger } from '@/components/LearnMorePopover';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { AlertDialog, Badge, Card, CardTitle } from '@/components/ui';
import { IndirectOwnership } from '@/core/IndirectOwnership';
import {
  INTERMEDIARY_OWNER_ROLE,
  type ValidationSummary,
} from '@/core/IndirectOwnership/IndirectOwnership.types';
import {
  getOrphanedIntermediaryPartyIds,
  pruneEmptyDetailFields,
} from '@/core/IndirectOwnership/utils';
import {
  OnboardingFormField,
  StepLayout,
} from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import { useStableStepSchemas } from '@/core/OnboardingFlow/hooks/useStableStepSchemas';
import {
  asPlainString,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { resolveDeltaModeConfig } from '@/core/OnboardingFlow/utils/deltaMode';
import {
  getFlowProgress,
  getStepperValidations,
} from '@/core/OnboardingFlow/utils/flowUtils';

export type PostPartyMutate = (args: {
  data: unknown;
}) => Promise<PartyResponse | undefined>;

/** Find an active organization party by (case-insensitive) name. */
export function findActiveOrgByName(
  parties: PartyResponse[],
  name: string
): PartyResponse | undefined {
  return parties.find(
    (p) =>
      p.active &&
      p.partyType === 'ORGANIZATION' &&
      p.organizationDetails?.organizationName?.trim().toLowerCase() ===
        name.trim().toLowerCase()
  );
}

/** Top-level party fields (besides parentPartyId/roles/details) that are safe
 * to copy onto a recreated party. Only defined values are included so we never
 * send empty stubs to POST /parties. */
function pickCompatiblePartyFields(
  ownerParty: PartyResponse
): Pick<
  PartyResponse,
  'email' | 'externalId' | 'access' | 'preferences' | 'networkRegistration'
> {
  const compatible: Pick<
    PartyResponse,
    'email' | 'externalId' | 'access' | 'preferences' | 'networkRegistration'
  > = {};
  if (ownerParty.email) compatible.email = ownerParty.email;
  if (ownerParty.externalId) compatible.externalId = ownerParty.externalId;
  if (ownerParty.access) compatible.access = ownerParty.access;
  if (ownerParty.preferences) compatible.preferences = ownerParty.preferences;
  if (ownerParty.networkRegistration) {
    compatible.networkRegistration = ownerParty.networkRegistration;
  }
  return compatible;
}

/**
 * Build the POST /parties body that recreates an owner under `parentPartyId`
 * with the given ownership `nature`. Preserves all compatible persisted data —
 * nested details plus top-level email/externalId/access/preferences/
 * networkRegistration and roles — pruning only empty stubs, and overrides just
 * parentPartyId and natureOfOwnership.
 */
export function buildRecreatedOwnerPayload(
  ownerParty: PartyResponse,
  parentPartyId: string,
  nature: 'Direct' | 'Indirect'
) {
  const details =
    ownerParty.partyType === 'INDIVIDUAL'
      ? {
          individualDetails: {
            ...pruneEmptyDetailFields(ownerParty.individualDetails),
            countryOfResidence:
              ownerParty.individualDetails?.countryOfResidence ?? 'US',
            natureOfOwnership: nature,
          },
        }
      : {
          organizationDetails: {
            ...pruneEmptyDetailFields(ownerParty.organizationDetails),
            organizationType:
              ownerParty.organizationDetails?.organizationType ??
              'LIMITED_LIABILITY_COMPANY',
            countryOfFormation:
              ownerParty.organizationDetails?.countryOfFormation ?? 'US',
            natureOfOwnership: nature,
          },
        };
  return {
    ...pickCompatiblePartyFields(ownerParty),
    partyType: ownerParty.partyType,
    roles: ownerParty.roles || ['BENEFICIAL_OWNER'],
    parentPartyId,
    ...details,
  };
}

/**
 * Create (or reuse) the intermediary chain from the client outward and return
 * the outermost intermediary's id (the party the owner is held through), or
 * null if a creation call returned no id. Throws if a reused entity already has
 * a conflicting relationship.
 */
/**
 * Resolve an existing, reusable intermediary for a chain step, or null when a
 * new party must be created. Throws when the persisted relationship conflicts
 * with the position the step occupies (a reused party can't be re-parented).
 */
function resolveReusableIntermediaryId(
  step: { entityName: string; partyId?: string },
  parentIdForNext: string,
  isRoot: boolean,
  parties: PartyResponse[]
): string | null {
  const existing = step.partyId
    ? parties.find((p) => p.active && p.id === step.partyId)
    : findActiveOrgByName(parties, step.entityName);
  if (!existing?.id) return null;

  if (existing.parentPartyId) {
    if (existing.parentPartyId !== parentIdForNext) {
      throw new Error(
        `Cannot reuse "${step.entityName}" — it already has a different ownership relationship. Use a different entity or update its existing relationship.`
      );
    }
  } else if (!isRoot) {
    // An unparented entity only represents implicit client ownership, which is
    // valid solely at the chain root. Elsewhere the missing relationship can't
    // be assigned, so reject rather than persist a divergent graph.
    throw new Error(
      `Cannot reuse "${step.entityName}" here — it has no ownership relationship and can only be reused as the entity that directly owns the business.`
    );
  }
  return existing.id;
}

export async function createOrReuseIntermediaryChain(
  steps: Array<{ entityName: string; partyId?: string }>,
  clientPartyId: string,
  parties: PartyResponse[],
  postPartyAsync: PostPartyMutate
): Promise<string | null> {
  const rootToOuter = [...steps].reverse();
  let parentIdForNext = clientPartyId;

  for (let i = 0; i < rootToOuter.length; i += 1) {
    const step = rootToOuter[i];
    const isRoot = i === 0;
    const reusedId = resolveReusableIntermediaryId(
      step,
      parentIdForNext,
      isRoot,
      parties
    );
    if (reusedId) {
      parentIdForNext = reusedId;
      continue;
    }

    // The chain root owns the client directly (parent CLIENT → Direct);
    // intermediaries held through another entity are Indirect.
    const created = await postPartyAsync({
      data: {
        partyType: 'ORGANIZATION',
        roles: [INTERMEDIARY_OWNER_ROLE],
        parentPartyId: parentIdForNext,
        organizationDetails: {
          organizationName: step.entityName,
          natureOfOwnership: isRoot ? 'Direct' : 'Indirect',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          countryOfFormation: 'US',
        },
      },
    });
    if (!created?.id) return null;
    parentIdForNext = created.id;
  }

  return parentIdForNext;
}

/** Label for the "continue" button, which varies by review mode and whether
 * the indirect-ownership flow is active. */
function getContinueButtonLabel(
  reviewMode: boolean,
  showIndirectFlow: boolean,
  labels: { review: ReactNode; indirect: ReactNode; default: ReactNode }
): ReactNode {
  if (reviewMode) return labels.review;
  return showIndirectFlow ? labels.indirect : labels.default;
}

/** Informational note shown when the controller can no longer be added as an
 * owner because the four-owner limit is reached and it was declared a
 * non-owner. Renders nothing when the conditions aren't met. */
function ControllerMaxOwnersNote({
  ownerCount,
  answer,
  controllerUpdatePending,
  text,
}: {
  ownerCount: number;
  answer: string | undefined;
  controllerUpdatePending: boolean;
  text: ReactNode;
}) {
  if (ownerCount < 4 || answer !== 'no' || controllerUpdatePending) return null;
  return (
    <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-blue-500">
      {'\u24d8 '}
      {text}
    </p>
  );
}

/** Surfaces the first defined error among the section's mutations. */
function OwnersServerError({ errors }: { errors: unknown[] }) {
  return <ServerErrorAlert error={errors.find(Boolean) as never} />;
}

/** Warning shown once the four-owner maximum is reached. */
function MaxOwnersWarning({
  ownerCount,
  text,
}: {
  ownerCount: number;
  text: ReactNode;
}) {
  if (ownerCount < 4) return null;
  return (
    <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
      {'\u24d8 '}
      {text}
    </p>
  );
}

/** Whether the controller-is-an-owner question should be locked. */
function isControllerQuestionDisabled(
  isFormDisabled: boolean,
  hasController: boolean,
  ownerCount: number,
  answer: string | undefined
): boolean {
  return (
    isFormDisabled || !hasController || (ownerCount >= 4 && answer === 'no')
  );
}

export const OwnersSectionScreen = () => {
  const [openedRemoveDialog, setOpenedRemoveDialog] = useState(false);
  const [indirectGatingAnswer, setIndirectGatingAnswer] = useState<
    'direct-only' | 'has-indirect' | null
  >(null);
  const [indirectValidationSummary, setIndirectValidationSummary] =
    useState<ValidationSummary | null>(null);

  const {
    clientData,
    onPostClientSettled,
    onPostPartySettled: onPostPartyResponse,
    organizationType,
    enableIndirectOwnership,
    deltaMode,
  } = useOnboardingContext();
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const queryClient = useQueryClient();

  const controllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      party.active
  );

  const {
    originScreenId,
    currentScreenId,
    goTo,
    staticScreens,
    sections,
    sessionData,
    updateSessionData,
    savedFormValues,
    deltaModeActive,
  } = useFlowContext();

  const hasPreloadedOwnershipStructure = enableIndirectOwnership
    ? !!clientData?.parties?.some(
        (party) =>
          party.active &&
          (party.roles?.includes('BENEFICIAL_OWNER') ||
            party.roles?.includes(INTERMEDIARY_OWNER_ROLE))
      )
    : false;

  useEffect(() => {
    if (!enableIndirectOwnership) return;

    if (indirectGatingAnswer !== null) {
      return;
    }

    if (sessionData.indirectOwnershipGatingAnswer) {
      setIndirectGatingAnswer(sessionData.indirectOwnershipGatingAnswer);
      return;
    }

    if (hasPreloadedOwnershipStructure) {
      setIndirectGatingAnswer('has-indirect');
      updateSessionData({ indirectOwnershipGatingAnswer: 'has-indirect' });
    }
  }, [
    enableIndirectOwnership,
    indirectGatingAnswer,
    sessionData.indirectOwnershipGatingAnswer,
    hasPreloadedOwnershipStructure,
    updateSessionData,
  ]);
  // Delta-mode host declaration that the controller is not a beneficial owner:
  // pre-answers the 25% question "No" and drops its required gate. Applies only
  // while delta mode is active (there is no standalone prop).
  const defaultControllerNotAnOwner =
    deltaModeActive &&
    (resolveDeltaModeConfig(deltaMode)?.defaultControllerNotAnOwner ?? false);

  // Stable, unfiltered step schemas so the validation helpers below stay
  // hook-free (constant schema-hook count regardless of visibility / owners).
  const stableStepSchemas = useStableStepSchemas();

  const { sectionStatuses } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId,
    stableStepSchemas
  );

  const reviewMode = originScreenId === 'review-attest-section';

  const form = useForm({
    defaultValues: {
      controllerIsAnOwner: controllerParty
        ? controllerParty.roles?.includes('BENEFICIAL_OWNER')
          ? 'yes'
          : sessionData.isControllerOwnerQuestionAnswered
            ? 'no'
            : // When the host opts in, pre-answer "No" so the question is not
              // required to advance (the user can still switch it to "Yes").
              defaultControllerNotAnOwner
              ? 'no'
              : undefined
        : undefined,
    },
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  const {
    mutate: updateController,
    error: controllerUpdateError,
    status: controllerUpdateStatus,
  } = useUpdatePartyLegacy();

  // Update controller roles on change
  useEffect(() => {
    const updateControllerRoles = (controllerId: string, roles: Role[]) => {
      updateController(
        {
          partyId: controllerId,
          data: {
            roles,
          },
        },
        {
          onSettled: (data, error) => {
            onPostPartyResponse?.(data, error?.response?.data);
          },
          onSuccess: (response) => {
            if (clientData) {
              queryClient.setQueryData(
                getSmbdoGetClientQueryKey(clientData.id),
                (oldClientData: ClientResponse | undefined) => ({
                  ...oldClientData,
                  parties: oldClientData?.parties?.map((party) => {
                    if (party.id === response.id) {
                      return {
                        ...party,
                        ...response,
                        roles,
                      };
                    }
                    return party;
                  }),
                })
              );
              queryClient.invalidateQueries({
                queryKey: getSmbdoGetClientQueryKey(clientData.id),
              });
            }
          },
          onError: (error) => {
            form.setValue(
              'controllerIsAnOwner',
              controllerParty?.roles?.includes('BENEFICIAL_OWNER')
                ? 'yes'
                : 'no'
            );
            form.setError('controllerIsAnOwner', {
              type: 'server',
              message: error?.response?.data?.context?.[0]?.message,
            });
          },
        }
      );
    };

    if (
      form.watch('controllerIsAnOwner') === 'yes' &&
      controllerParty?.id &&
      controllerParty?.roles &&
      !controllerParty.roles.includes('BENEFICIAL_OWNER')
    ) {
      updateControllerRoles(controllerParty.id, [
        ...controllerParty.roles,
        'BENEFICIAL_OWNER',
      ]);
    } else if (
      form.watch('controllerIsAnOwner') === 'no' &&
      controllerParty?.id &&
      controllerParty?.roles &&
      controllerParty.roles.includes('BENEFICIAL_OWNER')
    ) {
      updateControllerRoles(controllerParty.id, [
        ...controllerParty.roles.filter((role) => role !== 'BENEFICIAL_OWNER'),
      ]);
    }

    // Only mark the question as answered once the user has actually chosen
    // an option. Marking it on mount (while the value is still undefined)
    // caused "No" to be silently auto-selected when returning to this step.
    if (
      form.watch('controllerIsAnOwner') !== undefined &&
      !sessionData.isControllerOwnerQuestionAnswered
    ) {
      updateSessionData({
        isControllerOwnerQuestionAnswered: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the controllerIsAnOwner answer changes; other referenced values are read as latest and excluded intentionally
  }, [form.watch('controllerIsAnOwner')]);

  // use to update party active status
  const {
    mutate: updatePartyActive,
    mutateAsync: updatePartyActiveAsync,
    error: partyActiveUpdateError,
    status: partyActiveUpdateStatus,
  } = useUpdatePartyLegacy();

  // For adding new parties (indirect ownership integration)
  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClientLegacy();

  // For creating intermediary chain parties and re-parenting indirect owners
  // via POST /parties (parentPartyId can only be set at creation).
  const { mutateAsync: postPartyAsync, error: postPartyError } = usePostParty();

  // Handler for IndirectOwnership → add a beneficial owner via API
  const handleAddIndirectOwner = (ownerData: {
    entityType: 'INDIVIDUAL' | 'BUSINESS';
    firstName?: string;
    lastName?: string;
    businessName?: string;
    ownershipType: 'DIRECT' | 'INDIRECT';
  }) => {
    if (!clientData) return;

    // Owners are created as children of the CLIENT party, and the API rejects
    // natureOfOwnership 'Indirect' when the parent role is CLIENT. Indirectness
    // is instead expressed structurally by the intermediary chain (children
    // that reference this owner as their parent), so we always send 'Direct'.
    const newParty =
      ownerData.entityType === 'INDIVIDUAL'
        ? {
            partyType: 'INDIVIDUAL' as const,
            roles: ['BENEFICIAL_OWNER' as const],
            individualDetails: {
              firstName: ownerData.firstName,
              lastName: ownerData.lastName,
              natureOfOwnership: 'Direct' as const,
              // API requires countryOfResidence on party creation; the detail
              // step lets the user change it later. Default matches fieldMap.
              countryOfResidence: 'US' as const,
            },
          }
        : {
            // Business entities are intermediary owners; they can be Direct or
            // Indirect owners in their own right (spec cases 3.3/3.4).
            partyType: 'ORGANIZATION' as const,
            roles: [INTERMEDIARY_OWNER_ROLE],
            organizationDetails: {
              organizationName: ownerData.businessName,
              natureOfOwnership: 'Direct' as const,
              // API requires organizationType on party creation; the detail
              // step lets the user change it. Default matches the common case.
              organizationType: 'LIMITED_LIABILITY_COMPANY' as const,
              // API requires countryOfFormation on party creation; the detail
              // step lets the user change it later. Default matches fieldMap.
              countryOfFormation: 'US' as const,
            },
          };

    updateClient(
      {
        id: clientData.id,
        data: {
          addParties: [newParty] as unknown as ClientResponse['parties'],
        },
      },
      {
        onSettled: (data, error) => {
          onPostClientSettled?.(data, error?.response?.data);
        },
        onSuccess: (response) => {
          const queryKey = getSmbdoGetClientQueryKey(clientData.id);
          queryClient.setQueryData(queryKey, response);
          queryClient.invalidateQueries({ queryKey });
        },
      }
    );
  };

  // Handler for IndirectOwnership → remove (deactivate) a beneficial owner
  const handleRemoveIndirectOwner = (ownerId: string) => {
    // If this is the controller party, only strip the BENEFICIAL_OWNER role
    // instead of deactivating the entire party (which would lose personal details)
    if (controllerParty?.id === ownerId) {
      const rolesWithoutOwner =
        controllerParty.roles?.filter((role) => role !== 'BENEFICIAL_OWNER') ??
        [];
      const clientPartyId = clientData?.parties?.find((p) =>
        p.roles?.includes('CLIENT')
      )?.id;
      const isIndirectController =
        !!controllerParty.parentPartyId &&
        controllerParty.parentPartyId !== clientPartyId;

      // Indirect controller-owner: the controller was recreated under an
      // intermediary to be an indirect owner. Removing beneficial ownership
      // must restore it as a direct, CLIENT-parented CONTROLLER, deactivate the
      // indirect replacement, and clean up any now-unreferenced intermediaries.
      if (isIndirectController && clientPartyId && clientData) {
        const orphanedIntermediaryIds = getOrphanedIntermediaryPartyIds(
          clientData.parties || [],
          ownerId
        );
        void (async () => {
          try {
            await postPartyAsync({
              data: {
                ...buildRecreatedOwnerPayload(
                  controllerParty,
                  clientPartyId,
                  'Direct'
                ),
                roles: rolesWithoutOwner,
              } as unknown as Parameters<typeof postPartyAsync>[0]['data'],
            });
            for (const partyId of [ownerId, ...orphanedIntermediaryIds]) {
              await updatePartyActiveAsync({
                partyId,
                data: { active: false },
              });
            }
          } catch (error) {
            onPostClientSettled?.(
              undefined,
              (error as { response?: { data?: unknown } })?.response
                ?.data as Parameters<NonNullable<typeof onPostClientSettled>>[1]
            );
          } finally {
            queryClient.invalidateQueries({
              queryKey: getSmbdoGetClientQueryKey(clientData.id),
            });
            form.setValue('controllerIsAnOwner', 'no');
          }
        })();
        return;
      }

      // Direct controller-owner: just strip the BENEFICIAL_OWNER role.
      updateController(
        {
          partyId: ownerId,
          data: { roles: rolesWithoutOwner },
        },
        {
          onSuccess: (response) => {
            if (clientData) {
              const queryKey = getSmbdoGetClientQueryKey(clientData.id);
              queryClient.setQueryData(
                queryKey,
                (oldClientData: ClientResponse | undefined) => ({
                  ...oldClientData,
                  parties: oldClientData?.parties?.map((party) => {
                    if (party.id === response.id) {
                      return {
                        ...party,
                        ...response,
                        roles: rolesWithoutOwner,
                      };
                    }
                    return party;
                  }),
                })
              );
              queryClient.invalidateQueries({ queryKey });
            }
            // Sync the radio group back to "no"
            form.setValue('controllerIsAnOwner', 'no');
          },
        }
      );
      return;
    }

    // Cascade removal: an indirect owner's intermediary chain must not linger
    // active after the owner is gone. Deactivate the owner together with any
    // intermediaries that become orphaned (not shared with another owner's
    // chain). Compute the orphans before mutating so the graph is intact.
    const orphanedIntermediaryIds = getOrphanedIntermediaryPartyIds(
      clientData?.parties || [],
      ownerId
    );
    const idsToDeactivate = [ownerId, ...orphanedIntermediaryIds];

    const patchPartyInCache = (response: PartyResponse) => {
      if (!clientData) return;
      const queryKey = getSmbdoGetClientQueryKey(clientData.id);
      queryClient.setQueryData(
        queryKey,
        (oldClientData: ClientResponse | undefined) => ({
          ...oldClientData,
          parties: oldClientData?.parties?.map((party) =>
            party.id === response.id ? { ...party, ...response } : party
          ),
        })
      );
    };

    void (async () => {
      try {
        for (const partyId of idsToDeactivate) {
          const response = await updatePartyActiveAsync({
            partyId,
            data: { active: false },
          });
          patchPartyInCache(response);
        }
      } catch (error) {
        onPostPartyResponse?.(
          undefined,
          (error as { response?: { data?: unknown } })?.response
            ?.data as Parameters<NonNullable<typeof onPostPartyResponse>>[1]
        );
      } finally {
        if (clientData) {
          queryClient.invalidateQueries({
            queryKey: getSmbdoGetClientQueryKey(clientData.id),
          });
        }
      }
    })();
  };

  // Handler for IndirectOwnership → save hierarchy.
  //
  // Builds the ownership chain in the API's required direction:
  //   CLIENT ← intermediary(owns client, Direct) ← ... ← intermediary(Indirect) ← owner
  // The API rejects an intermediary whose parent is an individual owner, and
  // rejects natureOfOwnership 'Indirect' when the parent role is CLIENT.
  // parentPartyId can only be set at creation (UpdatePartyRequest has no such
  // field), so the individual owner — originally added as a CLIENT child — is
  // deactivated and recreated under the outermost intermediary as Indirect.
  const handleSaveHierarchy = async (
    ownerId: string,
    steps: Array<{
      entityName: string;
      ownsRootBusinessDirectly: boolean;
      isExistingEntity?: boolean;
      partyId?: string;
    }>
  ) => {
    if (!clientData?.id) return;

    const clientPartyId = clientData.parties?.find((p) =>
      p.roles?.includes('CLIENT')
    )?.id;
    const ownerParty = clientData.parties?.find((p) => p.id === ownerId);
    if (!clientPartyId || !ownerParty || steps.length === 0) return;

    // A non-sole-proprietor controller may also be an indirect beneficial
    // owner. Persist the linear path like any other owner and preserve the
    // CONTROLLER role on the recreated party.
    try {
      const outermostIntermediaryId = await createOrReuseIntermediaryChain(
        steps,
        clientPartyId,
        clientData.parties ?? [],
        postPartyAsync as unknown as PostPartyMutate
      );
      if (!outermostIntermediaryId) return;

      // Recreate the owner under the outermost intermediary as an indirect
      // beneficial owner (parentPartyId can only be set at creation).
      await postPartyAsync({
        data: buildRecreatedOwnerPayload(
          ownerParty,
          outermostIntermediaryId,
          'Indirect'
        ) as unknown as Parameters<typeof postPartyAsync>[0]['data'],
      });

      // Deactivate the original CLIENT-child owner (replaced by the one above).
      await updatePartyActiveAsync({
        partyId: ownerId,
        data: { active: false },
      });
    } catch (error) {
      onPostClientSettled?.(
        undefined,
        (error as { response?: { data?: unknown } })?.response
          ?.data as Parameters<NonNullable<typeof onPostClientSettled>>[1]
      );
    } finally {
      const queryKey = getSmbdoGetClientQueryKey(clientData.id);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  // Handler for IndirectOwnership → change an owner's nature of ownership
  // (Direct <-> Indirect). Nature is never persisted as 'Indirect' on a
  // CLIENT-parented owner: the API rejects that. Indirectness is expressed
  // structurally by the intermediary chain instead.
  const handleChangeOwnerNature = (
    ownerId: string,
    nature: 'DIRECT' | 'INDIRECT'
  ) => {
    if (!clientData) return;

    // Switching to Indirect: nothing to persist here. The component opens the
    // chain builder next; creating the intermediary chain is what makes the
    // owner indirect (structurally, via child parties referencing this owner).
    if (nature === 'INDIRECT') return;

    // Reverting to Direct. Under the documented graph, the owner's
    // parentPartyId points to the outermost intermediary it owns — not the
    // other way around. Recreate the owner as a CLIENT-parented direct owner
    // (preserving its details and roles), deactivate the indirect replacement,
    // and deactivate any intermediaries orphaned by the change (those not
    // shared with another active owner's chain).
    const clientPartyId = clientData.parties?.find((p) =>
      p.roles?.includes('CLIENT')
    )?.id;
    const ownerParty = clientData.parties?.find((p) => p.id === ownerId);
    if (!clientPartyId || !ownerParty) return;

    // Already direct (parented to the client or unparented): nothing to do.
    if (
      !ownerParty.parentPartyId ||
      ownerParty.parentPartyId === clientPartyId
    ) {
      return;
    }

    const orphanedIntermediaryIds = getOrphanedIntermediaryPartyIds(
      clientData.parties || [],
      ownerId
    );

    void (async () => {
      try {
        // Recreate as a CLIENT-parented direct owner, preserving all data.
        await postPartyAsync({
          data: buildRecreatedOwnerPayload(
            ownerParty,
            clientPartyId,
            'Direct'
          ) as unknown as Parameters<typeof postPartyAsync>[0]['data'],
        });

        for (const partyId of [ownerId, ...orphanedIntermediaryIds]) {
          await updatePartyActiveAsync({ partyId, data: { active: false } });
        }
      } catch (error) {
        onPostPartyResponse?.(
          undefined,
          (error as { response?: { data?: unknown } })?.response
            ?.data as Parameters<NonNullable<typeof onPostPartyResponse>>[1]
        );
      } finally {
        queryClient.invalidateQueries({
          queryKey: getSmbdoGetClientQueryKey(clientData.id),
        });
      }
    })();
  };

  const ownersData =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER')
    ) || [];

  const activeOwners = ownersData.filter(
    (owner) => owner.active || owner.status === 'ACTIVE'
  );

  const ownerSteps =
    staticScreens.find((screen) => screen.id === 'owner-stepper')?.stepperConfig
      ?.steps || [];

  const ownersValidation = getStepperValidations(
    ownerSteps,
    activeOwners,
    clientData,
    savedFormValues,
    'owner-stepper',
    stableStepSchemas
  );

  const handleEditBeneficialOwner = (beneficialOwnerId: string | null) => {
    if (beneficialOwnerId) {
      const firstInvalidStep = ownersValidation[beneficialOwnerId]
        ? ownerSteps.find((step) => {
            return (
              ownersValidation[beneficialOwnerId].stepValidationMap[step.id] &&
              !ownersValidation[beneficialOwnerId].stepValidationMap[step.id]
                .isValid
            );
          })?.id
        : undefined;

      goTo('owner-stepper', {
        editingPartyId: beneficialOwnerId,
        previouslyCompleted: ownersValidation[beneficialOwnerId].allStepsValid,
        shortLabelOverride: 'Edit owner',
        initialStepperStepId: firstInvalidStep ?? ownerSteps.at(-1)?.id,
      });
    } else {
      goTo('owner-stepper', {
        shortLabelOverride: 'Add owner',
      });
    }
  };

  const deactivateBeneficialOwner = (beneficialOwnerId: string) => {
    updatePartyActive(
      {
        partyId: beneficialOwnerId,
        data: {
          active: false,
        },
      },
      {
        onSuccess: (response) => {
          if (clientData) {
            const queryKey = getSmbdoGetClientQueryKey(clientData.id);
            queryClient.setQueryData(
              queryKey,
              (oldClientData: ClientResponse | undefined) => ({
                ...oldClientData,
                parties: oldClientData?.parties?.map((party) => {
                  if (party.id === response.id) {
                    return {
                      ...party,
                      ...response,
                    };
                  }
                  return party;
                }),
              })
            );
            setOpenedRemoveDialog(false);
            queryClient.invalidateQueries({ queryKey });
          }
        },
      }
    );
  };

  const isFormDisabled =
    controllerUpdateStatus === 'pending' ||
    partyActiveUpdateStatus === 'pending' ||
    clientUpdateStatus === 'pending';

  // Whether the indirect-ownership flow is active (feature enabled and the user
  // did not answer the gating question "direct owners only").
  const showIndirectOwnershipFlow =
    !!enableIndirectOwnership && indirectGatingAnswer !== 'direct-only';

  const isIndirectOwnershipReadyToContinue =
    !enableIndirectOwnership ||
    indirectGatingAnswer === 'direct-only' ||
    (indirectGatingAnswer === 'has-indirect' &&
      !!indirectValidationSummary?.canComplete);

  const handleIndirectGatingAnswer = (
    answer: 'direct-only' | 'has-indirect'
  ) => {
    setIndirectGatingAnswer(answer);
    updateSessionData({ indirectOwnershipGatingAnswer: answer });
  };

  // TODO: get completed status from global stepper,
  // send completed status to global stepper

  return (
    <StepLayout
      title={t('screens.owners.title')}
      subTitle={
        <Button
          variant="link"
          onClick={() => goTo('overview')}
          className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
        >
          <ArrowLeftIcon className="eb-size-3.5" />
          {t('screens.owners.overviewButtonLabel')}
        </Button>
      }
      description={t('screens.owners.description')}
    >
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
        <Alert variant="informative">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertDescription className="eb-flex eb-flex-col">
            <p className="eb-mb-2 eb-text-sm eb-font-semibold">
              {t('screens.owners.infoAlert.header', { organizationType })}
            </p>
            <div className="eb-flex eb-items-center eb-space-x-2">
              <span className="eb-text-lg eb-font-bold">
                {t('screens.owners.infoAlert.title')}
              </span>
              <LearnMorePopoverTrigger
                content={
                  <div className="eb-space-y-3">
                    <h2 className="eb-font-header eb-text-xl eb-font-medium">
                      {t('screens.owners.tooltip.title')}
                    </h2>
                    <p className="eb-pb-1 eb-text-sm">
                      {t('screens.owners.tooltip.description')}
                    </p>
                  </div>
                }
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tString('common:aria.moreInformation')}
                >
                  <InfoIcon className="eb-size-6 eb-stroke-primary" />
                </Button>
              </LearnMorePopoverTrigger>
            </div>
            <div>
              <TransWithTokens
                ns="onboarding-overview"
                i18nKey="screens.owners.infoAlert.pleaseAddAllOwners"
              />
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form>
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              disabled={isControllerQuestionDisabled(
                isFormDisabled,
                controllerParty !== undefined,
                activeOwners.length,
                form.watch('controllerIsAnOwner')
              )}
              type="radio-group"
              name="controllerIsAnOwner"
              label={t('screens.owners.controllerIsOwnerQuestion')}
              description=""
              tooltip=""
              onChange={() => form.clearErrors('controllerIsAnOwner')}
              options={[
                { value: 'yes', label: t('common:yes') },
                { value: 'no', label: t('common:no') },
              ]}
              noOptionalLabel
            />
            {sectionStatuses['personal-section'] !== 'completed' && (
              <div className="eb-mt-2 eb-flex eb-items-center">
                <p className="eb-flex eb-h-8 eb-items-center eb-text-sm eb-font-normal eb-text-orange-500">
                  {'\u24d8'}
                  {' Please complete the personal details first.'}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="eb-h-8"
                  onClick={() => {
                    goTo('personal-section', {
                      editingPartyId: controllerParty?.id,
                    });
                  }}
                >
                  {t('screens.owners.goNowButton')}
                  <ArrowRightIcon />
                </Button>
              </div>
            )}
            <ControllerMaxOwnersNote
              ownerCount={activeOwners.length}
              answer={form.watch('controllerIsAnOwner')}
              controllerUpdatePending={controllerUpdateStatus === 'pending'}
              text={t('screens.owners.controllerCannotBeOwnerWarning')}
            />
            <div className="eb-mt-2 eb-inline-flex eb-h-4 eb-items-center eb-justify-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
              {controllerUpdateStatus === 'pending' && (
                <>
                  <Loader2Icon className="eb-pointer-events-none eb-size-4 eb-shrink-0 eb-animate-spin" />
                  <span>{t('screens.owners.makingChanges')}</span>
                </>
              )}
            </div>
          </form>
        </Form>

        {showIndirectOwnershipFlow ? (
          <IndirectOwnership
            key={`indirect-ownership-${indirectGatingAnswer ?? 'undecided'}`}
            client={clientData}
            className="eb-mt-4"
            showGatingQuestion={indirectGatingAnswer === null}
            onGatingAnswer={handleIndirectGatingAnswer}
            onValidationChange={setIndirectValidationSummary}
            onAddOwner={handleAddIndirectOwner}
            onRemoveOwner={handleRemoveIndirectOwner}
            onSaveHierarchy={handleSaveHierarchy}
            onChangeOwnerNature={handleChangeOwnerNature}
            onEditOwner={(ownerId) => {
              // Route to appropriate edit screen based on party type
              const party = clientData?.parties?.find((p) => p.id === ownerId);
              if (party?.partyType === 'ORGANIZATION') {
                // Business entities go directly to the intermediary stepper form
                goTo('intermediary-stepper', {
                  editingPartyId: ownerId,
                  shortLabelOverride: 'Edit business',
                });
              } else {
                // Individuals go to the owner-stepper form
                handleEditBeneficialOwner(ownerId);
              }
            }}
            controllerPartyId={controllerParty?.id}
          />
        ) : (
          <div className="eb-space-y-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="eb-w-full eb-text-lg"
              onClick={() => handleEditBeneficialOwner('')}
              disabled={isFormDisabled || activeOwners.length >= 4}
            >
              <PlusIcon /> {t('screens.owners.addOwnerButton')}
            </Button>

            <MaxOwnersWarning
              ownerCount={ownersData.length}
              text={t('screens.owners.maxOwnersWarning')}
            />
            {activeOwners.length === 0 && (
              <Card className="eb-mt-6 eb-p-4 eb-shadow-md">
                <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
                  <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                    <UsersIcon className="eb-size-4 eb-fill-white eb-stroke-white" />
                  </div>
                  <p className="eb-text-sm">
                    {t('screens.owners.noStakeholdersAdded')}
                  </p>
                </div>
              </Card>
            )}

            {activeOwners.map((owner) => {
              const jobTitle = asPlainString(owner.individualDetails?.jobTitle);
              const jobTitleDescription = asPlainString(
                owner.individualDetails?.jobTitleDescription
              );
              return (
                <Card
                  key={owner.id}
                  className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
                >
                  <div className="eb-space-y-1">
                    <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                      {getPartyName(owner)}
                    </CardTitle>
                    <p className="eb-text-sm eb-font-medium">
                      {jobTitle === 'Other'
                        ? `${tString('jobTitles.Other', { defaultValue: 'Other' })} - ${jobTitleDescription}`
                        : t(`jobTitles.${jobTitle}`, {
                            defaultValue: jobTitle,
                          })}
                    </p>
                    <div className="eb-flex eb-gap-2 eb-pt-2">
                      <Badge
                        variant="outline"
                        className="eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]"
                      >
                        {t('screens.owners.badges.owner')}
                      </Badge>
                      {owner.roles?.includes('CONTROLLER') && (
                        <Badge
                          variant="outline"
                          className="eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                        >
                          {t('screens.owners.badges.controller')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="eb-flex eb-gap-2 eb-pt-4">
                    {!owner.roles?.includes('CONTROLLER') && (
                      <AlertDialog
                        open={openedRemoveDialog}
                        onOpenChange={setOpenedRemoveDialog}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <TrashIcon />
                            {t('screens.owners.removeOwnerButton')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="eb-component">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('screens.owners.removeOwnerDialog.title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <TransWithTokens
                                ns="onboarding-overview"
                                i18nKey="screens.owners.removeOwnerDialog.description"
                                values={{
                                  owner: getPartyName(owner),
                                }}
                              />
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t(
                                'screens.owners.removeOwnerDialog.cancelButton'
                              )}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                owner.id && deactivateBeneficialOwner(owner.id)
                              }
                            >
                              {partyActiveUpdateStatus === 'pending' && (
                                <Loader2Icon className="eb-size-4 eb-animate-spin" />
                              )}
                              {t(
                                'screens.owners.removeOwnerDialog.confirmButton'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        owner.id && handleEditBeneficialOwner(owner.id)
                      }
                    >
                      <PencilIcon />
                      {t('screens.owners.editOwnerButton')}
                    </Button>
                  </div>
                  {owner.id && !ownersValidation[owner.id]?.allStepsValid && (
                    <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
                      {'\u24d8 '}
                      {t('screens.owners.ownerIncompleteWarning')}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="eb-mt-6 eb-space-y-6">
        <OwnersServerError
          errors={[
            controllerUpdateError,
            partyActiveUpdateError,
            clientUpdateError,
            postPartyError,
          ]}
        />
        <div className="eb-flex eb-justify-between eb-gap-4">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="eb-h-auto eb-min-h-11 eb-w-full eb-text-wrap eb-text-lg"
            onClick={() => {
              const controllerQuestionAnswered =
                form.getValues('controllerIsAnOwner') !== undefined;

              if (!isIndirectOwnershipReadyToContinue) {
                return;
              }

              // Block advancing until the required 25% ownership question is
              // answered, showing a required-field validation error — unless
              // the host opted out via `defaultControllerNotAnOwner`.
              if (!controllerQuestionAnswered && !defaultControllerNotAnOwner) {
                form.setError('controllerIsAnOwner', {
                  type: 'required',
                  message: tString('additionalQuestions.validation.required'),
                });
                return;
              }

              updateSessionData({
                isOwnersSectionDone: true,
                mockedVerifyingSectionId: 'owners-section',
              });

              if (reviewMode) {
                goTo('review-attest-section', {
                  reviewScreenOpenedSectionId: 'owners-section',
                });
              } else if (showIndirectOwnershipFlow) {
                goTo('indirect-owner-details');
              } else {
                goTo('additional-questions-section');
              }
            }}
            disabled={isFormDisabled || !isIndirectOwnershipReadyToContinue}
          >
            {getContinueButtonLabel(reviewMode, showIndirectOwnershipFlow, {
              review: t('screens.owners.saveAndReturnToReviewButton'),
              indirect: t('screens.owners.saveAndContinueToOwnerDetailsButton'),
              default: t('screens.owners.saveAndContinueButton'),
            })}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
