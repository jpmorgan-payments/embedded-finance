import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import type { QuestionResponse } from '@/api/generated/smbdo.schemas';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import {
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { generatePartyRequestBody } from '@/core/OnboardingFlow/utils/formUtils';

import type { useTermsAndConditions } from '../TermsAndConditionsForm/useTermsAndConditions';
import {
  areDeltaPendingFieldsComplete,
  buildDeltaPendingSubmitPayload,
  collectBaselineDeltaPendingGroups,
} from './DeltaPendingFieldsPanel';

type TermsApi = ReturnType<typeof useTermsAndConditions>;

/**
 * Shared dirty-only save + finish-gate + KYC for panel and inline delta review.
 */
export function useDeltaReviewSubmit(args: {
  deltaPendingForm: UseFormReturn<Record<string, unknown>>;
  deltaAllQuestions: QuestionResponse[];
  terms: TermsApi;
}) {
  const { deltaPendingForm, deltaAllQuestions, terms } = args;
  const { clientData, onPostPartySettled, onPostClientSettled } =
    useOnboardingContext();
  const {
    sections,
    sessionData,
    updateSessionData,
    currentScreenId,
    savedFormValues,
    setIsFormSubmitting,
    staticScreens,
  } = useFlowContext();
  const queryClient = useQueryClient();
  const { mutateAsync: updatePartyAsync, error: partyUpdateError } =
    useUpdatePartyLegacy();
  const { mutateAsync: updateClientAsync, error: clientUpdateError } =
    useSmbdoUpdateClientLegacy();
  const [deltaSaveError, setDeltaSaveError] = useState(false);
  const [shouldDisplayAlert, setShouldDisplayAlert] = useState(false);

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ||
    sections.find((section) => section.id === 'owners-section')?.stepperConfig
      ?.steps ||
    [];

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];

  const saveDeltaPendingFields = async (
    values: Record<string, unknown>
  ): Promise<boolean> => {
    if (!clientData?.id) {
      return false;
    }

    const payload = buildDeltaPendingSubmitPayload(
      values,
      deltaAllQuestions,
      outstandingQuestionIds,
      deltaPendingForm.formState.dirtyFields as Record<string, unknown>
    );

    setIsFormSubmitting(true);
    setDeltaSaveError(false);

    try {
      const orgParty = getOrganizationParty(clientData);
      if (
        Object.keys(payload.organizationPartyValues).length > 0 &&
        orgParty?.id
      ) {
        await updatePartyAsync(
          {
            partyId: orgParty.id,
            data: generatePartyRequestBody(payload.organizationPartyValues, {}),
          },
          {
            onSettled: (data, error) => {
              onPostPartySettled?.(data, error?.response?.data);
            },
          }
        );
      }

      const controllerParty = getPartyByAssociatedPartyFilters(clientData, {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      });
      if (
        Object.keys(payload.controllerPartyValues).length > 0 &&
        controllerParty?.id
      ) {
        await updatePartyAsync(
          {
            partyId: controllerParty.id,
            data: generatePartyRequestBody(payload.controllerPartyValues, {}),
          },
          {
            onSettled: (data, error) => {
              onPostPartySettled?.(data, error?.response?.data);
            },
          }
        );
      }

      for (const ownerUpdate of payload.ownerUpdates) {
        if (Object.keys(ownerUpdate.values).length > 0) {
          await updatePartyAsync(
            {
              partyId: ownerUpdate.partyId,
              data: generatePartyRequestBody(ownerUpdate.values, {}),
            },
            {
              onSettled: (data, error) => {
                onPostPartySettled?.(data, error?.response?.data);
              },
            }
          );
        }
      }

      if (payload.questionResponses.length > 0) {
        await updateClientAsync(
          {
            id: clientData.id,
            data: { questionResponses: payload.questionResponses },
          },
          {
            onSettled: (data, error) => {
              onPostClientSettled?.(data, error?.response?.data);
            },
          }
        );
      }

      await queryClient.invalidateQueries({
        queryKey: getSmbdoGetClientQueryKey(clientData.id),
      });
      return true;
    } catch {
      setDeltaSaveError(true);
      setIsFormSubmitting(false);
      return false;
    }
  };

  const handleDeltaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pendingValues = deltaPendingForm.getValues() as Record<
      string,
      unknown
    >;
    const liveOverlay = {
      ...(savedFormValues as Record<string, unknown> | undefined),
      ...pendingValues,
    };
    const baselinePendingGroups = collectBaselineDeltaPendingGroups({
      sections,
      clientData,
      savedFormValues,
      currentScreenId,
      ownerSteps,
    });

    const pendingValid = await deltaPendingForm.trigger();
    const partiesAndQuestionsComplete = areDeltaPendingFieldsComplete({
      baselinePendingGroups,
      sections,
      clientData,
      ownerSteps,
      liveOverlay,
      currentScreenId,
      outstandingQuestionIds,
      liveFormValues: pendingValues,
    });
    if (!pendingValid || !partiesAndQuestionsComplete) {
      setShouldDisplayAlert(true);
      return;
    }

    const saved = await saveDeltaPendingFields(pendingValues);
    if (!saved) {
      return;
    }

    updateSessionData({
      completedStaticStepIds: Array.from(
        new Set([
          ...(sessionData.completedStaticStepIds ?? []),
          'review',
          'documents',
        ])
      ),
      isOwnersSectionDone: true,
    });

    const submitted = await terms.trySubmit();
    if (!submitted) {
      setIsFormSubmitting(false);
    }
  };

  return {
    handleDeltaSubmit,
    shouldDisplayAlert,
    setShouldDisplayAlert,
    deltaSaveError,
    partyUpdateError,
    clientUpdateError,
    ownerSteps,
  };
}
