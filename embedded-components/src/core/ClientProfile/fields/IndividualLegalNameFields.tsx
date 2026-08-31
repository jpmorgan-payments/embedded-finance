import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { ProfileTextField } from '../forms/ProfileTextField';

export type IndividualLegalNameFieldContent = {
  firstName: {
    label: ReactNode;
    placeholder?: string;
    description?: ReactNode;
  };
  middleName: {
    label: ReactNode;
    placeholder?: string;
    description?: ReactNode;
  };
  lastName: { label: ReactNode; placeholder?: string; description?: ReactNode };
  optionalLabel?: ReactNode;
};

type IndividualLegalNameFieldsProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  fieldNames: {
    firstName: FieldPath<TFieldValues>;
    middleName: FieldPath<TFieldValues>;
    lastName: FieldPath<TFieldValues>;
  };
  content: IndividualLegalNameFieldContent;
};

export function IndividualLegalNameFields<TFieldValues extends FieldValues>({
  control,
  fieldNames,
  content,
}: IndividualLegalNameFieldsProps<TFieldValues>) {
  return (
    <>
      <ProfileTextField
        control={control}
        name={fieldNames.firstName}
        label={content.firstName.label}
        placeholder={content.firstName.placeholder}
        description={content.firstName.description}
        required
      />
      <ProfileTextField
        control={control}
        name={fieldNames.middleName}
        label={content.middleName.label}
        placeholder={content.middleName.placeholder}
        description={content.middleName.description}
        optionalLabel={content.optionalLabel}
      />
      <ProfileTextField
        control={control}
        name={fieldNames.lastName}
        label={content.lastName.label}
        placeholder={content.lastName.placeholder}
        description={content.lastName.description}
        required
      />
    </>
  );
}
