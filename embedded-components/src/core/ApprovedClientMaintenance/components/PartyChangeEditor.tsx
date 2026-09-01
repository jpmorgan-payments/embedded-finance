import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form } from '@/components/ui';
import { IndividualLegalNameFields } from '@/core/ClientProfile/fields/IndividualLegalNameFields';
import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';
import { createIndividualLegalNameSchemaShape } from '@/core/ClientProfile/schemas/individualLegalNameSchema';

import {
  buildPartyNameUpdate,
  type PartyNameUpdateRequest,
} from '../utils/buildPartyNameUpdate';

type PartyChangeEditorProps = {
  initialValues: IndividualLegalNameValues;
  approvedValues: IndividualLegalNameValues;
  isSubmitting: boolean;
  mutationError?: unknown;
  onDiscard: () => void;
  onSave: (
    values: IndividualLegalNameValues,
    request: PartyNameUpdateRequest
  ) => Promise<void>;
};

const VALIDATION_FIELD_NAMES: Record<keyof IndividualLegalNameValues, string> =
  {
    firstName: 'controllerFirstName',
    middleName: 'controllerMiddleName',
    lastName: 'controllerLastName',
  };

export function PartyChangeEditor({
  initialValues,
  approvedValues,
  isSubmitting,
  mutationError,
  onDiscard,
  onSave,
}: PartyChangeEditorProps) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const [formError, setFormError] = useState<string>();
  const schema = z.object(
    createIndividualLegalNameSchemaShape(
      {
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
      },
      (fieldName, messageKey) => {
        const validationFieldName =
          VALIDATION_FIELD_NAMES[fieldName as keyof IndividualLegalNameValues];
        return tString([
          `onboarding-overview:fields.${validationFieldName}.validation.${messageKey}`,
        ] as unknown as TemplateStringsArray);
      }
    )
  );
  const form = useForm<IndividualLegalNameValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });
  const currentValues = form.watch();
  const update = buildPartyNameUpdate(initialValues, {
    firstName: currentValues.firstName ?? '',
    middleName: currentValues.middleName ?? '',
    lastName: currentValues.lastName ?? '',
  });
  const hasChanges = update.kind === 'changed';

  const describeApproved = (field: keyof IndividualLegalNameValues) => {
    const currentValue = currentValues[field] ?? '';
    const approvedValue = approvedValues[field];
    if (currentValue === approvedValue) return undefined;
    return tString('editor.originalValue', {
      value: approvedValue || tString('notProvided'),
    });
  };

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const nextUpdate = buildPartyNameUpdate(initialValues, values);
    if (nextUpdate.kind === 'unchanged') {
      setFormError(tString('editor.noChanges'));
      return;
    }
    if (nextUpdate.kind === 'unsupported-clear') {
      setFormError(tString('editor.unsupportedClear'));
      return;
    }

    try {
      await onSave(values, nextUpdate.request);
    } catch {
      // The mutation exposes its API error while preserving entered values.
    }
  });

  return (
    <div className="eb-p-4">
      {mutationError ? (
        <div className="eb-mb-4">
          <ServerErrorAlert error={mutationError as never} />
        </div>
      ) : null}
      {formError ? (
        <Alert variant="warning" noTitle className="eb-mb-4">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={submit} className="eb-space-y-4">
          <fieldset
            className="eb-grid eb-gap-4 sm:eb-grid-cols-3"
            disabled={isSubmitting}
          >
            <IndividualLegalNameFields
              control={form.control}
              fieldNames={{
                firstName: 'firstName',
                middleName: 'middleName',
                lastName: 'lastName',
              }}
              content={{
                firstName: {
                  label: t('editor.firstName'),
                  placeholder: tString('editor.firstNamePlaceholder'),
                  description: describeApproved('firstName'),
                },
                middleName: {
                  label: t('editor.middleName'),
                  placeholder: tString('editor.middleNamePlaceholder'),
                  description: describeApproved('middleName'),
                },
                lastName: {
                  label: t('editor.lastName'),
                  placeholder: tString('editor.lastNamePlaceholder'),
                  description: describeApproved('lastName'),
                },
                optionalLabel: t('common:optional'),
              }}
            />
          </fieldset>

          <div className="eb-flex eb-justify-end eb-gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={isSubmitting}
            >
              {t('editor.cancelEditing')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? (
                <Loader2Icon className="eb-animate-spin" />
              ) : null}
              {t('editor.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
