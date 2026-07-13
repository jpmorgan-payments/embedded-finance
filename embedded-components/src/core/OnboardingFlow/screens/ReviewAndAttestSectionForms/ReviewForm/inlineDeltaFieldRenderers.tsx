import type { ReactNode } from 'react';
import { DollarSignIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type { QuestionResponse } from '@/api/generated/smbdo.schemas';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { MONEY_INPUT_QUESTION_IDS } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/OperationalDetailsForm.schema';

import type { DeltaPendingField } from './deltaPendingTypes';

type TranslateFn = (...args: any[]) => any;

/**
 * Render an inline editor for a Zod-pending party field (panel + inline delta).
 */
export function renderDeltaPartyField(args: {
  form: UseFormReturn<Record<string, unknown>>;
  field: DeltaPendingField;
  tString: TranslateFn;
}): ReactNode {
  const { form, field, tString } = args;
  const control = form.control as any;
  const logicalKey = field.fieldKey;
  let name = field.formPath;

  // Normalize controllerIds to the value leaf when the issue was on the array root
  if (logicalKey === 'controllerIds' && !name.endsWith('.value')) {
    name = name.endsWith('controllerIds') ? `${name}.0.value` : `${name}.value`;
  }

  // Nested `owners.{partyId}.*` paths are not in partyFieldMap. Also strip
  // the owners prefix from content-token lookups by supplying explicit
  // label/description/tooltip — otherwise OnboardingFormField looks up
  // `fields.owners.controllerIds.value.*` and shows NO CONTENT TOKEN FOUND.
  const disableFieldRuleMapping = name.startsWith('owners.');

  const ownerFieldCopy = (
    i18nKey: string,
    fallback: { label: string; description?: string; placeholder?: string }
  ) =>
    disableFieldRuleMapping
      ? {
          label: tString(i18nKey as any, fallback.label),
          // Empty string suppresses getContentToken('description'/'tooltip')
          description: fallback.description ?? '',
          tooltip: '',
          placeholder: fallback.placeholder
            ? tString(
                `${i18nKey.replace(/\.label$/, '.placeholder')}` as any,
                fallback.placeholder
              )
            : undefined,
        }
      : {};

  if (logicalKey === 'organizationIdEin') {
    return (
      <OnboardingFormField
        key={name}
        control={control}
        name={name}
        type="text"
        maskFormat="## - #######"
        maskChar="_"
        required
        obfuscateWhenUnfocused
        disableFieldRuleMapping={disableFieldRuleMapping}
        {...ownerFieldCopy('fields.organizationIdEin.label', {
          label: 'EIN',
          placeholder: 'Enter EIN',
        })}
      />
    );
  }

  if (logicalKey === 'controllerIds' || logicalKey === 'solePropSsn') {
    const idCopy =
      logicalKey === 'solePropSsn'
        ? ownerFieldCopy('fields.solePropSsn.label', {
            label: 'SSN',
            description: '',
            placeholder: 'Enter SSN',
          })
        : ownerFieldCopy('fields.controllerIds.value.label', {
            label: 'ID value',
            description: '',
            placeholder: 'Enter ID value',
          });
    return (
      <OnboardingFormField
        key={name}
        control={control}
        name={name}
        type="text"
        maskFormat="### - ## - ####"
        maskChar="_"
        obfuscateWhenUnfocused
        required
        disableFieldRuleMapping={disableFieldRuleMapping}
        {...idCopy}
      />
    );
  }

  if (logicalKey === 'birthDate') {
    return (
      <OnboardingFormField
        key={name}
        control={control}
        name={name}
        type="importantDate"
        required
        disableFieldRuleMapping={disableFieldRuleMapping}
        {...ownerFieldCopy('fields.birthDate.label', {
          label: 'Date of birth',
        })}
      />
    );
  }

  if (logicalKey === 'controllerEmail' || logicalKey === 'organizationEmail') {
    return (
      <OnboardingFormField
        key={name}
        control={control}
        name={name}
        type="email"
        required
        disableFieldRuleMapping={disableFieldRuleMapping}
        {...ownerFieldCopy(`fields.${logicalKey}.label`, {
          label: 'Email',
          placeholder: 'Enter email',
        })}
      />
    );
  }

  if (logicalKey === 'controllerPhone' || logicalKey === 'organizationPhone') {
    const phoneName = name.endsWith('.phoneNumber')
      ? name
      : `${name}.phoneNumber`;
    return (
      <OnboardingFormField
        key={phoneName}
        control={control}
        name={phoneName}
        type="phone"
        required
        disableFieldRuleMapping={disableFieldRuleMapping}
        {...ownerFieldCopy(`fields.${logicalKey}.label`, {
          label: 'Phone',
        })}
      />
    );
  }

  // Any other field missing from GET client / Zod — generic text input.
  const leaf = field.issuePath.split('.').pop() ?? logicalKey;
  return (
    <OnboardingFormField
      key={name}
      control={control}
      name={name}
      type="text"
      required
      disableFieldRuleMapping={disableFieldRuleMapping}
      {...(disableFieldRuleMapping
        ? {
            label: tString(
              [
                `fields.${logicalKey}.${leaf}.label`,
                `fields.${logicalKey}.label`,
                `fields.${field.issuePath.replace(/^owners\.[^.]+\./, '')}.label`,
                `addressFields.${leaf}.label.default`,
              ] as any,
              leaf
            ),
            description: '',
            tooltip: '',
          }
        : {})}
    />
  );
}

/**
 * Render an inline editor for an outstanding operational question (panel + inline).
 */
export function renderDeltaQuestionInput(args: {
  form: UseFormReturn<Record<string, unknown>>;
  question: QuestionResponse;
  t: TranslateFn;
}): ReactNode {
  const { form, question, t } = args;
  const fieldName = `question_${question.id ?? 'undefined'}`;
  const itemType = question?.responseSchema?.items?.type ?? 'string';
  const itemEnum = question?.responseSchema?.items?.enum;

  const questionLabel = (
    <div>
      {question.description?.split('\n')?.map((line, index) => (
        <div key={`${question.id}-label-${index}`}>
          <FormLabel
            asterisk={index === 0}
            className={cn({
              'eb-ml-4': index > 0,
            })}
          >
            {line}
          </FormLabel>
        </div>
      ))}
    </div>
  );

  if (question.id && MONEY_INPUT_QUESTION_IDS.includes(question.id)) {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            {questionLabel}
            <div className="eb-relative">
              <DollarSignIcon
                aria-hidden="true"
                className="eb-pointer-events-none eb-absolute eb-inset-y-0 eb-left-3 eb-my-auto eb-size-4 eb-text-gray-500"
              />
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={0}
                  max={10000000000}
                  step={1}
                  inputMode="decimal"
                  placeholder="0"
                  className="eb-pl-9"
                  value={(field.value as string[] | undefined)?.[0] ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const numeric = parseFloat(raw);
                    if (
                      raw === '' ||
                      (numeric >= 0 && numeric <= 10000000000)
                    ) {
                      field.onChange([raw]);
                    }
                  }}
                  onBlur={field.onBlur}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  switch (itemType) {
    case 'boolean':
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="eb-space-y-3">
              {questionLabel}
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange([value])}
                  value={(field.value as string[] | undefined)?.[0] ?? ''}
                  className="eb-flex eb-flex-col eb-space-y-1"
                >
                  <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                    <FormControl>
                      <RadioGroupItem value="true" />
                    </FormControl>
                    <FormLabel className="eb-font-normal">
                      {t('common:yes', 'Yes')}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                    <FormControl>
                      <RadioGroupItem value="false" />
                    </FormControl>
                    <FormLabel className="eb-font-normal">
                      {t('common:no', 'No')}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case 'integer':
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              {questionLabel}
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={(field.value as string[] | undefined)?.[0] ?? ''}
                  onChange={(e) => field.onChange([e.target.value])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    default:
      if (itemEnum?.length) {
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                {questionLabel}
                <Select
                  onValueChange={(value) => field.onChange([value])}
                  value={(field.value as string[] | undefined)?.[0] ?? ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {itemEnum.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              {questionLabel}
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string[] | undefined)?.[0] ?? ''}
                  onChange={(e) => field.onChange([e.target.value])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
  }
}
