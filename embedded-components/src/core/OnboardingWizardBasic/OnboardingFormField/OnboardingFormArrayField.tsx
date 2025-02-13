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
import { OnboardingWizardArrayFieldNames } from '../utils/types';

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
  renderItem: (props: {
    field: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>;
    index: number;
    label: string;
    required: boolean | undefined; // whether it's required according to requiredItems
    disabled: boolean;
    renderRemoveButton: () => React.ReactNode;
  }) => React.ReactNode;
  renderReadOnlyItem?: (props: {
    field: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>;
    index: number;
    label: string;
  }) => React.ReactNode;
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

  const { fieldRule, ruleType } = getFieldRule(
    name as OnboardingWizardArrayFieldNames
  );

  if (ruleType !== 'array') {
    throw new Error(`Field ${name} is not configured as an array field.`);
  }

  const fieldVisibility = fieldRule.visibility ?? 'visible';
  const fieldDisabled = disabled ?? fieldVisibility === 'disabled';

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
    if (fieldVisibility === 'readonly') {
      return null;
    }
    if (fields.length <= (fieldRule.minItems ?? 0)) {
      return null;
    }
    return (
      <Button
        variant="destructive"
        size="icon"
        className={cn('eb-mt-2', removeButtonClassName)}
        onClick={() => remove(index)}
        disabled={fieldDisabled}
      >
        {getContentToken('removeLabel', index)}
      </Button>
    );
  };

  const renderAppendButton = () => {
    if (fieldVisibility === 'readonly') {
      return null;
    }
    if (fields.length >= (fieldRule.maxItems ?? Infinity)) {
      return null;
    }
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('eb-mt-2', appendButtonClassName)}
        onClick={() => append(defaultAppendValue)}
        disabled={fieldDisabled}
      >
        {getContentToken('appendLabel')}
      </Button>
    );
  };

  return (
    <div className={className}>
      {fields.map((field, index) => {
        if (fieldVisibility === 'readonly') {
          return renderReadOnlyItem?.({
            field,
            index,
            label: getContentToken('label', index),
          });
        }
        return renderItem({
          field,
          index,
          label: getContentToken('label', index),
          required: index < (fieldRule.requiredItems ?? 0),
          disabled: fieldDisabled,
          renderRemoveButton: () => renderRemoveButton(index),
        });
      })}

      {renderAppendButton()}
    </div>
  );
}
