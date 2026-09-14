import { useEffect } from 'react';
import {
  useFormContext,
  useWatch,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';

import { ProfileFieldRestore } from '../forms/ProfileFieldRestore';
import { ProfileSelectField } from '../forms/ProfileSelectField';
import { ProfileTextField } from '../forms/ProfileTextField';
import type { ProfileFieldRestoreAction } from '../forms/ProfileTextField';
import {
  getDefaultIndividualIdType,
  getIndividualIdTypesForCountry,
  isTaxpayerIdType,
  NON_US_INDIVIDUAL_ID_TYPES,
  US_INDIVIDUAL_ID_TYPES,
} from '../utils/identityDocumentTypes';

export type ProfileIdentityFieldContent = {
  idType: string;
  idTypePlaceholder: string;
  idValue: Record<string, string>;
  idValueDescription?: Record<string, string>;
  optionalLabel?: string;
};

type ProfileIdentityFieldsProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  countryName: FieldPathByValue<TFieldValues, string>;
  idTypeName: FieldPathByValue<TFieldValues, string>;
  idValueName: FieldPathByValue<TFieldValues, string>;
  content: ProfileIdentityFieldContent;
  restoreAction?: ProfileFieldRestoreAction;
};

export function ProfileIdentityFields<TFieldValues extends FieldValues>({
  control,
  countryName,
  idTypeName,
  idValueName,
  content,
  restoreAction,
}: ProfileIdentityFieldsProps<TFieldValues>) {
  const form = useFormContext<TFieldValues>();
  const country = useWatch({ control, name: countryName });
  const idType = useWatch({ control, name: idTypeName });
  const isUsIdentity = country === 'US';
  const availableIdTypes = getIndividualIdTypesForCountry(country);

  useEffect(() => {
    const currentIdType = form.getValues(idTypeName);
    if (
      isUsIdentity &&
      !US_INDIVIDUAL_ID_TYPES.includes(currentIdType as never)
    ) {
      form.setValue(idTypeName, getDefaultIndividualIdType(country) as never, {
        shouldDirty: true,
      });
      form.setValue(idValueName, '' as never, { shouldDirty: true });
    } else if (
      !isUsIdentity &&
      !NON_US_INDIVIDUAL_ID_TYPES.includes(currentIdType as never)
    ) {
      form.setValue(idTypeName, '' as never, { shouldDirty: true });
      form.setValue(idValueName, '' as never, { shouldDirty: true });
    }
    form.clearErrors([idTypeName, idValueName]);
    // The form facade and field paths are read as latest. This transition is
    // intentionally scoped to country behavior, matching OnboardingFlow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUsIdentity]);

  const selectedIdType = String(idType ?? '');
  const isTaxId = isTaxpayerIdType(selectedIdType);

  return (
    <div className="eb-space-y-4">
      <ProfileSelectField
        control={control}
        name={idTypeName}
        label={content.idType}
        options={availableIdTypes.map((value) => ({
          value,
          label: content.idValue[value] ?? value,
        }))}
        placeholder={content.idTypePlaceholder}
        required
        onValueChange={() => {
          form.setValue(idValueName, '' as never, {
            shouldDirty: true,
            shouldValidate: true,
          });
          form.clearErrors(idValueName);
        }}
      />
      {selectedIdType ? (
        <ProfileTextField
          key={selectedIdType}
          control={control}
          name={idValueName}
          label={content.idValue[selectedIdType] ?? content.idType}
          description={content.idValueDescription?.[selectedIdType]}
          required
          maskFormat={isTaxId ? '### - ## - ####' : undefined}
          maskChar={isTaxId ? '_' : undefined}
          obfuscateWhenUnfocused={isTaxId}
          inputProps={{ autoComplete: 'off' }}
        />
      ) : null}
      {restoreAction ? <ProfileFieldRestore action={restoreAction} /> : null}
    </div>
  );
}
