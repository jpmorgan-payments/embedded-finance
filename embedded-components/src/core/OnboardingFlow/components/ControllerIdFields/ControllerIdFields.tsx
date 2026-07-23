import { useEffect } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ChevronDownIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { IndividualIdentityIdType } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OnboardingFormField } from '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingFormField';

/** Extends the API type with an empty string to represent "no selection yet". */
type IdTypeSelection = IndividualIdentityIdType | '';

const US_ID_TYPES: readonly IdTypeSelection[] = ['SSN', 'ITIN'] as const;
const NON_US_ID_TYPES: readonly IdTypeSelection[] = [
  'PASSPORT',
  'DRIVERS_LICENSE',
  'OTHER_GOVERNMENT_ID',
] as const;

/**
 * Shared identity-document editor: the ID type + value inputs plus the
 * "Use a different ID type" switcher. Rendered by BOTH the onboarding
 * `IndividualIdentityForm` step and the delta-mode review panel, so the
 * composite lives in ONE place instead of being duplicated per surface.
 *
 * `namePrefix` scopes the react-hook-form field names:
 * - `''` (default) → the controller / step-form path (`controllerIds.0.*`).
 * - `owners.{partyId}.` → a beneficial owner in the delta panel.
 *
 * When prefixed, the paths are not in `partyFieldMap`, so field-rule /
 * content-token mapping is disabled and the value copy is supplied explicitly.
 * The component reads (but does not render) the issuer to derive US vs non-US
 * behavior — the issuer selector, when present, is owned by the caller.
 */
export function ControllerIdFields({
  namePrefix = '',
}: {
  namePrefix?: string;
}) {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const form = useFormContext();
  const control = form.control as any;

  const isPrefixed = namePrefix !== '';
  const idTypeName = `${namePrefix}controllerIds.0.idType`;
  const issuerName = `${namePrefix}controllerIds.0.issuer`;
  const valueName = `${namePrefix}controllerIds.0.value`;

  // Scoped subscriptions (not `form.watch`) so changing the ID type / issuer
  // re-renders only this editor — not the form host, which in delta mode would
  // re-run the expensive pending-fields validation.
  const issuer =
    (useWatch({
      control: form.control,
      name: issuerName as never,
    }) as unknown as string | undefined) ?? 'US';
  const isUS = issuer === 'US';
  const watchedIdType = useWatch({
    control: form.control,
    name: idTypeName as never,
  }) as unknown as string | undefined;
  const currentIdType: IdTypeSelection = (watchedIdType ||
    (isUS ? 'SSN' : '')) as IdTypeSelection;
  const isSsnOrItin = currentIdType === 'SSN' || currentIdType === 'ITIN';
  const availableIdTypes = isUS ? US_ID_TYPES : NON_US_ID_TYPES;

  const getValueLabel = (idType: IdTypeSelection) =>
    idType
      ? tString([`idValueLabels.${idType}`] as any)
      : tString(['idValueLabels.placeholder'] as any, 'ID number');
  const getValueDescription = (idType: IdTypeSelection) =>
    idType ? tString([`idValueDescriptions.${idType}`] as any, '') : '';

  // Reset the ID type when switching between US and non-US so the value matches
  // the available types. Non-US starts empty so the user picks explicitly. In
  // delta there is no issuer control, so `isUS` never changes and this is inert.
  useEffect(() => {
    const currentType = form.getValues(idTypeName) as IdTypeSelection;
    if (isUS && !US_ID_TYPES.includes(currentType)) {
      form.setValue(idTypeName as any, 'SSN');
      form.setValue(valueName as any, '');
    } else if (
      !isUS &&
      currentType !== '' &&
      !NON_US_ID_TYPES.includes(currentType)
    ) {
      form.setValue(idTypeName as any, '');
      form.setValue(valueName as any, '');
    }
  }, [isUS]);

  useEffect(() => {
    form.clearErrors(valueName);
  }, [currentIdType]);

  // For owner-prefixed paths (not in partyFieldMap) supply explicit copy and
  // disable rule mapping; for the controller/step path let OnboardingFormField
  // resolve required / tooltip from the field config as it does everywhere else.
  const valuePrefixProps = isPrefixed
    ? { disableFieldRuleMapping: true, required: true, tooltip: '' }
    : {};

  return (
    <div className="eb-space-y-3">
      {!isUS && (
        <OnboardingFormField
          control={control}
          name={idTypeName}
          type="select"
          required
          disableFieldRuleMapping
          label={tString(
            ['fields.controllerIds.idType.label'] as any,
            'ID type'
          )}
          description={tString(
            ['fields.controllerIds.idType.description'] as any,
            ''
          )}
          tooltip=""
          options={NON_US_ID_TYPES.map((idType) => ({
            value: idType,
            label: getValueLabel(idType),
          }))}
        />
      )}
      {(isUS || currentIdType) && (
        <OnboardingFormField
          key={currentIdType}
          control={control}
          name={valueName}
          type="text"
          maskFormat={isSsnOrItin ? '### - ## - ####' : undefined}
          maskChar={isSsnOrItin ? '_' : undefined}
          obfuscateWhenUnfocused={isSsnOrItin}
          label={getValueLabel(currentIdType)}
          description={getValueDescription(currentIdType)}
          inputProps={{
            // Give each ID type a unique DOM name so the browser keeps separate
            // autocomplete histories per type. RHF tracks the field via ref.
            name: `id-value-${currentIdType?.toLowerCase() || 'none'}`,
          }}
          {...valuePrefixProps}
        />
      )}
      {isUS && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" type="button" size="sm">
              {t(
                'screens.overview.deltaView.differentIdType',
                'Use a different ID type'
              )}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="eb-component">
            {availableIdTypes.map((idType) => (
              <DropdownMenuItem
                key={idType}
                disabled={currentIdType === idType}
                onClick={() => {
                  form.setValue(idTypeName as any, idType);
                  form.setValue(issuerName as any, 'US');
                  form.setValue(valueName as any, '', { shouldDirty: true });
                }}
              >
                {getValueLabel(idType)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
