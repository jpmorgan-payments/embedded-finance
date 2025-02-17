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

type BaseRenderProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = {
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>[];
  renderAppendButton: (className?: string) => React.ReactNode;
};

interface RenderItemProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
> extends BaseRenderProps<TFieldValues, TFieldArrayName> {
  field: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>;
  index: number;
  itemLabel: string;
  disabled: boolean;
  renderRemoveButton: (className?: string) => React.ReactNode;
}

interface OnboardingArrayFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> extends Omit<UseFieldArrayProps<TFieldValues, TFieldArrayName>, 'rules'> {
  removeButtonClassName?: string;
  appendButtonClassName?: string;
  minItems?: number;
  maxItems?: number;
  appendValue?: FieldArray<TFieldValues, TFieldArrayName>;
  disabled?: boolean;
  readonly?: boolean;
  renderItem: (
    props: RenderItemProps<TFieldValues, TFieldArrayName>
  ) => React.ReactNode;
  renderReadOnlyItem?: (
    props: RenderItemProps<TFieldValues, TFieldArrayName>
  ) => React.ReactNode;
  renderHeader?: (
    props: BaseRenderProps<TFieldValues, TFieldArrayName>
  ) => React.ReactNode;
  renderFooter?: (
    props: BaseRenderProps<TFieldValues, TFieldArrayName>
  ) => React.ReactNode;
  disableFieldRuleMapping?: boolean;
}

export function OnboardingArrayField<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
>({
  control,
  name,
  appendValue,
  disabled,
  readonly,
  renderItem,
  renderReadOnlyItem = (field) => JSON.stringify(field),
  renderHeader,
  renderFooter,
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

  const getContentToken = (id: string, number?: number) => {
    const key = `fields.${nameNoIndex}.${id}`;
    return t(
      [key, 'common:noTokenFallback'] as unknown as TemplateStringsArray,
      {
        number,
        key,
      }
    );
  };

  const getItemLabel = (index: number) =>
    fieldRule.minItems === 1 && fieldRule.maxItems === 1 && fields.length === 1
      ? getContentToken('itemLabel')
      : getContentToken('itemLabelNumbered', index + 1);

  const renderRemoveButton = (index: number, className?: string) => {
    if (fieldInteraction === 'readonly') {
      return null;
    }
    if (
      fields.length === fieldRule.minItems &&
      fields.length === fieldRule.maxItems
    ) {
      return null;
    }
    return (
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className={cn('eb-mt-2', className)}
        onClick={() => remove(index)}
        disabled={
          fieldInteraction === 'disabled' ||
          fields.length <= (fieldRule.minItems ?? 0)
        }
      >
        {getContentToken('removeLabel', index)}
      </Button>
    );
  };

  const renderAppendButton = (className?: string) => {
    if (fieldInteraction === 'readonly') {
      return null;
    }
    if (
      fields.length === fieldRule.minItems &&
      fields.length === fieldRule.maxItems
    ) {
      return null;
    }
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('eb-mt-2', className)}
        onClick={() => append(fieldAppendValue)}
        disabled={
          fieldInteraction === 'disabled' ||
          fields.length >= (fieldRule.maxItems ?? Infinity)
        }
      >
        {getContentToken('appendLabel')}
      </Button>
    );
  };

  const renderContent = (
    renderItemProps: RenderItemProps<TFieldValues, TFieldArrayName>
  ) =>
    fieldInteraction === 'readonly'
      ? renderReadOnlyItem(renderItemProps)
      : renderItem(renderItemProps);

  const baseRenderProps = {
    fields,
    renderAppendButton,
  };

  return (
    <>
      {renderHeader?.(baseRenderProps)}
      {fields.map((field, index) => {
        const renderItemProps = {
          ...baseRenderProps,
          field,
          index,
          itemLabel: getItemLabel(index),
          disabled: fieldInteraction === 'disabled',
          renderRemoveButton: (className?: string) =>
            renderRemoveButton(index, className),
        };

        return renderContent(renderItemProps);
      })}
      {renderFooter?.(baseRenderProps)}
    </>
  );
}
