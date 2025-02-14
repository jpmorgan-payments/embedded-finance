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
import { useFormUtilsWithClientContext } from '../utils/formUtils';
import {
  ArrayFieldRule,
  OnboardingWizardArrayFieldNames,
} from '../utils/types';

interface OnboardingArrayFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> extends UseFieldArrayProps<TFieldValues, TFieldArrayName> {
  className?: string;
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
  disableFieldRuleMapping?: boolean;
  fieldRuleOverride?: ArrayFieldRule;
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
  disableFieldRuleMapping,
  fieldRuleOverride = {},
}: OnboardingArrayFieldProps<TFieldValues, TFieldArrayName>) {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFormUtilsWithClientContext(clientData);

  const { t } = useTranslation(['onboarding', 'common']);

  let fieldRule: ArrayFieldRule = {};
  if (disableFieldRuleMapping) {
    fieldRule = {
      minItems: 0,
      maxItems: Infinity,
      requiredItems: 0,
    };
  } else {
    const fieldRuleConfig = getFieldRule(
      name as OnboardingWizardArrayFieldNames
    );
    if (fieldRuleConfig.ruleType !== 'array') {
      throw new Error(`Field ${name} is not configured as an array field.`);
    }
    fieldRule = fieldRuleConfig.fieldRule;
  }
  // Apply overrides if provided
  fieldRule = {
    ...fieldRule,
    ...fieldRuleOverride,
  };

  const fieldVisibility = fieldRule.visibility ?? 'visible';

  if (fieldVisibility === 'hidden') {
    return null;
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // TODO: handle no content token found
  const getContentToken = (id: string, number?: number) =>
    t([`fields.${name}.${id}`, ''] as unknown as TemplateStringsArray, {
      number,
    });

  const getFieldLabel = (index: number) =>
    fieldRule.minItems === 1 && fieldRule.maxItems === 1 && fields.length === 1
      ? getContentToken('label')
      : getContentToken('labelNumbered', index + 1);

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
        disabled={fieldVisibility === 'disabled'}
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
        disabled={fieldVisibility === 'disabled'}
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
            label: getFieldLabel(index),
          });
        }
        return renderItem({
          field,
          index,
          label: getFieldLabel(index),
          required: index < (fieldRule.requiredItems ?? 0),
          disabled: fieldVisibility === 'disabled',
          renderRemoveButton: () => renderRemoveButton(index),
        });
      })}

      {renderAppendButton()}
    </div>
  );
}
