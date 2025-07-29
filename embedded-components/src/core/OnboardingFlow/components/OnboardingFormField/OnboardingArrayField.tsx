import { useTranslation } from '@/i18n/useTranslation';
import { PlusIcon, TrashIcon } from 'lucide-react';
import {
  FieldArray,
  FieldArrayPath,
  FieldArrayWithId,
  FieldValue,
  FieldValues,
  useFieldArray,
  UseFieldArrayProps,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import {
  ArrayFieldRule,
  OnboardingTopLevelArrayFieldNames,
  OptionalDefaults,
} from '@/core/OnboardingFlow/types/form.types';
import { useFormUtilsWithClientContext } from '@/core/OnboardingFlow/utils/formUtils';

type ButtonProps = {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
};

type BaseRenderProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = {
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>[];
  renderAppendButton: (props?: ButtonProps) => React.ReactNode;
};

interface RenderItemProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
> extends BaseRenderProps<TFieldValues, TFieldArrayName> {
  field: FieldArrayWithId<TFieldValues, TFieldArrayName, 'id'>;
  index: number;
  itemLabel: string;
  disabled: boolean;
  renderRemoveButton: (props?: ButtonProps) => React.ReactNode;
}

interface OnboardingArrayFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> extends Omit<UseFieldArrayProps<TFieldValues, TFieldArrayName>, 'rules'> {
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
  renderWrapper?: (children: React.ReactNode) => React.ReactNode;
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
  renderFooter = ({ renderAppendButton }) => renderAppendButton(),
  renderWrapper = (children) => <>{children}</>,
  disableFieldRuleMapping,
  ...props
}: OnboardingArrayFieldProps<TFieldValues, TFieldArrayName>) {
  const { clientData } = useOnboardingContext();
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
    fieldRule.maxItems === 1 && fields.length === 1
      ? getContentToken('itemLabel')
      : getContentToken('itemLabelNumbered', index + 1);

  const renderRemoveButton = (index: number, buttonProps?: ButtonProps) => {
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
        size={buttonProps?.size}
        className={buttonProps?.className}
        onClick={() => remove(index)}
        disabled={
          fieldInteraction === 'disabled' ||
          fields.length <= (fieldRule.minItems ?? 0)
        }
        aria-label={getContentToken('removeLabel', index)}
      >
        {buttonProps?.children ?? (
          <>
            <TrashIcon />
            {getContentToken('removeLabel', index)}
          </>
        )}
      </Button>
    );
  };

  const renderAppendButton = (buttonProps?: ButtonProps) => {
    if (fieldInteraction === 'readonly') {
      return null;
    }
    if (fields.length === fieldRule.maxItems) {
      return null;
    }
    return (
      <Button
        type="button"
        variant="outline"
        size={buttonProps?.size}
        className={buttonProps?.className}
        onClick={() => append(fieldAppendValue)}
        disabled={
          fieldInteraction === 'disabled' ||
          fields.length >= (fieldRule.maxItems ?? Infinity)
        }
      >
        {buttonProps?.children ?? (
          <>
            <PlusIcon />
            {getContentToken('appendLabel')}
          </>
        )}
      </Button>
    );
  };

  const renderContent = (
    renderItemProps: RenderItemProps<TFieldValues, TFieldArrayName>
  ) =>
    fieldInteraction === 'readonly'
      ? renderReadOnlyItem(renderItemProps)
      : renderItem(renderItemProps);

  const baseRenderProps: BaseRenderProps<TFieldValues, TFieldArrayName> = {
    fields,
    renderAppendButton,
  };

  if (fieldDisplay === 'hidden') {
    return null;
  }
  return (
    <>
      {renderHeader?.(baseRenderProps)}
      {renderWrapper(
        fields.map((field, index) => {
          const renderItemProps = {
            ...baseRenderProps,
            field,
            index,
            itemLabel: getItemLabel(index),
            disabled: fieldInteraction === 'disabled',
            renderRemoveButton: (buttonProps?: ButtonProps) =>
              renderRemoveButton(index, buttonProps),
          };

          return renderContent(renderItemProps);
        })
      )}
      {renderFooter?.(baseRenderProps)}
    </>
  );
}
