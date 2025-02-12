import {
  FieldArray,
  FieldArrayPath,
  FieldArrayWithId,
  FieldValues,
  useFieldArray,
  UseFieldArrayProps,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Button } from '@/components/ui/button';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { useFilterFunctionsByClientContext } from '../utils/formUtils';
import { FieldRule, OnboardingWizardFormValues } from '../utils/types';

interface OnboardingArrayFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> extends UseFieldArrayProps<TFieldValues, TFieldArrayName> {
  className?: string;
  disabled?: boolean;
  removeButtonClassName?: string;
  appendButtonClassName?: string;
  defaultAppendValue: FieldArray<TFieldValues, TFieldArrayName>;
  renderItem: (
    field: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>,
    index: number,
    label: string,
    required: boolean | undefined, // whether it's required according to requiredItems
    disabled: boolean,
    renderRemoveButton: () => React.ReactNode
  ) => React.ReactNode;
  renderReadOnlyItem?: (
    field: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>,
    index: number,
    label: string
  ) => React.ReactNode;
}

export function OnboardingArrayField<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
>({
  control,
  name,
  className,
  removeButtonClassName,
  appendButtonClassName,
  defaultAppendValue,
  renderItem,
  renderReadOnlyItem = (field) => JSON.stringify(field),
  disabled,
}: OnboardingArrayFieldProps<TFieldValues, TFieldArrayName>) {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFilterFunctionsByClientContext(clientData);

  const { t } = useTranslation(['onboarding', 'common']);

  const fieldRule: FieldRule = getFieldRule(
    name as keyof OnboardingWizardFormValues
  );

  const fieldVisibility = fieldRule.visibility ?? 'visible';

  if (fieldVisibility === 'hidden') {
    return null;
  }

  const getContentToken = (id: string, index?: number) =>
    t([`fields.${name}.${id}`, ''] as unknown as TemplateStringsArray, {
      index,
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const renderRemoveButton = (index: number) => {
    return (
      <Button
        variant="destructive"
        size="icon"
        className={cn('ml-auto', removeButtonClassName)}
        onClick={() => remove(index)}
        disabled={disabled}
      >
        {getContentToken('removeLabel', index)}
      </Button>
    );
  };

  return (
    <div className={className}>
      {fields.map((field, index) => {
        if (fieldVisibility === 'readonly') {
          return renderReadOnlyItem?.(
            field,
            index,
            getContentToken('label', index)
          );
        }
        return renderItem(
          field,
          index,
          getContentToken('label', index),
          fieldRule.required,
          fieldVisibility === 'disabled',
          () => renderRemoveButton(index)
        );
      })}
      <Button
        variant="outline"
        size="sm"
        className={cn('eb-mt-2', appendButtonClassName)}
        onClick={() => append(defaultAppendValue)}
        disabled={disabled}
      >
        {getContentToken('appendLabel')}
      </Button>
    </div>
  );
}
