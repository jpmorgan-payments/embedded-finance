import {
  FieldArray,
  FieldArrayPath,
  FieldArrayWithId,
  FieldValue,
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
  OnboardingTopLevelArrayFieldNames,
  OptionalDefaults,
} from '../utils/types';

interface OnboardingArrayFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> extends Omit<UseFieldArrayProps<TFieldValues, TFieldArrayName>, 'rules'> {
  removeButtonClassName?: string;
  appendButtonClassName?: string;
  minItems?: number;
  maxItems?: number;
  requiredItems?: number;
  appendValue?: FieldArray<TFieldValues, TFieldArrayName>;
  disabled?: boolean;
  readonly?: boolean;
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
}

export function OnboardingArrayField<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
>({
  control,
  name,
  removeButtonClassName,
  appendButtonClassName,
  appendValue,
  disabled,
  readonly,
  renderItem,
  renderReadOnlyItem = (field) => JSON.stringify(field),
  disableFieldRuleMapping,
  ...props
}: OnboardingArrayFieldProps<TFieldValues, TFieldArrayName>) {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFormUtilsWithClientContext(clientData);

  const { t } = useTranslation(['onboarding', 'common']);

  let fieldRule: OptionalDefaults<ArrayFieldRule<FieldValue<TFieldValues>>> =
    {};

  if (!disableFieldRuleMapping) {
    const fieldRuleConfig = getFieldRule(
      name as OnboardingTopLevelArrayFieldNames
    );
    if (fieldRuleConfig.ruleType !== 'array') {
      throw new Error(`Field ${name} is not configured as an array field.`);
    }
    fieldRule = fieldRuleConfig.fieldRule;
  }

  const fieldDisplay = fieldRule.display ?? 'visible';
  const fieldInteraction =
    readonly || fieldRule.interaction === 'readonly'
      ? 'readonly'
      : disabled || fieldRule.interaction === 'disabled'
        ? 'disabled'
        : (fieldRule.interaction ?? 'enabled');
  const fieldAppendValue =
    appendValue ??
    fieldRule.defaultAppendValue ??
    ({} as FieldValue<TFieldValues>);
  if (fieldDisplay === 'hidden') {
    return null;
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name,
    ...props,
  });

  const nameNoIndex = name
    .split('.')
    .filter((segment) => !/^\d+$/.test(segment))
    .join('.');

  // TODO: handle no content token found
  const getContentToken = (id: string, number?: number) =>
    t([`fields.${nameNoIndex}.${id}`, ''] as unknown as TemplateStringsArray, {
      number,
    });

  const getFieldLabel = (index: number) =>
    fieldRule.minItems === 1 && fieldRule.maxItems === 1 && fields.length === 1
      ? getContentToken('label')
      : getContentToken('labelNumbered', index + 1);

  const renderRemoveButton = (index: number) => {
    if (fieldInteraction === 'readonly') {
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
        disabled={fieldInteraction === 'disabled'}
      >
        {getContentToken('removeLabel', index)}
      </Button>
    );
  };

  const renderAppendButton = () => {
    if (fieldInteraction === 'readonly') {
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
        onClick={() => append(fieldAppendValue)}
        disabled={fieldInteraction === 'disabled'}
      >
        {getContentToken('appendLabel')}
      </Button>
    );
  };

  return (
    <>
      {fields.map((field, index) => {
        if (fieldInteraction === 'readonly') {
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
          disabled: fieldInteraction === 'disabled',
          renderRemoveButton: () => renderRemoveButton(index),
        });
      })}

      {renderAppendButton()}
    </>
  );
}
