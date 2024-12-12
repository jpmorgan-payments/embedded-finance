import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { InfoPopover } from '@/components/ux/InfoPopover';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { useFilterFunctionsByClientContext } from '../utils/formUtils';
import { OnboardingWizardFormValues } from '../utils/types';

type FieldType =
  | 'text'
  | 'email'
  | 'select'
  | 'radio-group'
  | 'checkbox'
  | 'array';

interface BaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  type: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  visibility?: 'visible' | 'hidden' | 'disabled';
}

interface SelectOrRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: 'select' | 'radio-group';
  options: Array<{ label: string; value: string }>;
}

interface OtherFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: Exclude<FieldType, 'select' | 'radio-group'>;
  options?: never;
}

type OnboardingFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | SelectOrRadioGroupProps<TFieldValues, TName>
  | OtherFieldProps<TFieldValues, TName>;

export const OnboardingFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  type = 'text',
  label,
  placeholder,
  description,
  tooltip,
  required,
  visibility,
  options,
  ...props
}: OnboardingFormFieldProps<TFieldValues, TName>) => {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFilterFunctionsByClientContext(clientData);

  const { t } = useTranslation('onboarding');

  const fieldRule = getFieldRule(
    name.split('.')[0] as keyof OnboardingWizardFormValues
  );

  const fieldVisibility = visibility ?? fieldRule.visibility;

  if (fieldVisibility === 'hidden') {
    return null;
  }

  // Split the name into a name and index for the translation function
  const nameParts = name.split('.');
  const tName = nameParts
    .filter((part) => Number.isNaN(Number(part)))
    .join('.');
  const lastIndex = nameParts
    .reverse()
    .find((part) => !Number.isNaN(Number(part)));

  return (
    <FormField
      control={control}
      name={name}
      disabled={fieldVisibility === 'disabled'}
      render={({ field }) => (
        <FormItem>
          <div className="eb-flex eb-items-center eb-space-x-2">
            <FormLabel asterisk={required ?? fieldRule.required}>
              {label ??
                t(
                  [
                    `fields.${tName}.label`,
                    '',
                  ] as unknown as TemplateStringsArray,
                  { index: lastIndex }
                )}
            </FormLabel>
            <InfoPopover>
              {tooltip ??
                t(
                  [
                    `fields.${tName}.tooltip`,
                    '',
                  ] as unknown as TemplateStringsArray,
                  { index: lastIndex }
                )}
            </InfoPopover>
          </div>
          <FormDescription>
            {description ??
              t(
                [
                  `fields.${tName}.description`,
                  '',
                ] as unknown as TemplateStringsArray,
                { index: lastIndex }
              )}
          </FormDescription>

          {(() => {
            switch (type) {
              case 'select':
                return (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue placeholder="Select address type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options?.map((option) => (
                        <SelectItem value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              case 'email':
              case 'radio-group':
              case 'checkbox':
              case 'text':
              default:
                return (
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value}
                      placeholder={
                        placeholder ??
                        t(
                          [
                            `fields.${tName}.placeholder`,
                            '',
                          ] as unknown as TemplateStringsArray,
                          { index: lastIndex }
                        )
                      }
                    />
                  </FormControl>
                );
            }
          })()}

          <FormMessage />
        </FormItem>
      )}
      {...props}
    />
  );
};
