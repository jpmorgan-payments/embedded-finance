import { useMemo, useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { RefreshCwIcon } from 'lucide-react';
import { useForm, useWatch, type FieldValues } from 'react-hook-form';

import {
  useSmbdoSubmitDocumentRequest,
  useSmbdoUploadDocument,
} from '@/api/generated/smbdo';
import type {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form } from '@/components/ui';
import { DocumentRequestCard } from '@/core/OnboardingFlow/screens/DocumentUploadScreen/DocumentRequestCard';

import {
  getDocumentUploadSelections,
  isDocumentRequestReady,
  type DocumentUploadFormValues,
} from '../utils/documentUploadTasks';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenancePageBody } from './MaintenancePageBody';

type DocumentUploadRequestFormProps = {
  documentRequest: DocumentRequestResponse;
  maxFileSizeBytes?: number;
  /** Shown above the upload fields, scrolling with them. */
  intro?: ReactNode;
  onCancel: () => void;
  onComplete: () => Promise<void> | void;
};

export function DocumentUploadRequestForm({
  documentRequest,
  maxFileSizeBytes,
  intro,
  onCancel,
  onComplete,
}: DocumentUploadRequestFormProps) {
  const { t } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
  ]);
  const [resetKey, setResetKey] = useState(0);
  const uploadMutation = useSmbdoUploadDocument();
  const submitMutation = useSmbdoSubmitDocumentRequest();
  const form = useForm<FieldValues>({
    defaultValues: documentRequest.id ? { [documentRequest.id]: {} } : {},
  });
  const watchedValues = useWatch({ control: form.control });
  const uploads = useMemo(
    () =>
      getDocumentUploadSelections(
        documentRequest,
        (watchedValues ?? {}) as DocumentUploadFormValues
      ),
    [documentRequest, watchedValues]
  );
  const isReady = isDocumentRequestReady(documentRequest, uploads);
  const satisfiedDocTypes = [
    ...new Set(uploads.map((upload) => upload.documentType)),
  ];
  const requirementDocTypes = uploads.reduce<
    Record<number, DocumentTypeSmbdo[]>
  >((typesByRequirement, upload) => {
    const existingTypes = typesByRequirement[upload.requirementIndex] ?? [];
    if (!existingTypes.includes(upload.documentType)) {
      existingTypes.push(upload.documentType);
    }
    typesByRequirement[upload.requirementIndex] = existingTypes;
    return typesByRequirement;
  }, {});
  const activeRequirements = (documentRequest.requirements ?? []).map(
    (_, index) => index
  );

  const reset = () => {
    form.reset(documentRequest.id ? { [documentRequest.id]: {} } : {});
    uploadMutation.reset();
    submitMutation.reset();
    setResetKey((currentKey) => currentKey + 1);
  };

  const submit = form.handleSubmit(async () => {
    if (!documentRequest.id || !isReady) return;
    try {
      for (const upload of uploads) {
        await uploadMutation.mutateAsync({
          data: {
            documentData: JSON.stringify({
              documentType: upload.documentType,
              documentRequestId: documentRequest.id,
            }),
            file: upload.file,
          },
        });
      }
      await submitMutation.mutateAsync({ id: documentRequest.id });
      await onComplete();
    } catch {
      // Mutation errors are rendered below without clearing selected files.
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} data-maintenance-page-fill="">
        <MaintenancePageBody>
          {intro}
          <div className="eb-space-y-4 eb-px-4 eb-py-4 @[40rem]:eb-px-5 @[40rem]:eb-pt-5">
            <DocumentRequestCard
              documentRequest={documentRequest}
              activeRequirements={activeRequirements}
              satisfiedDocTypes={satisfiedDocTypes}
              requirementDocTypes={requirementDocTypes}
              control={form.control}
              watch={form.watch}
              resetKey={resetKey}
              onReset={reset}
              showReset={false}
              maxFileSizeBytes={maxFileSizeBytes}
            />

            <div className="eb-flex eb-justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={
                  form.formState.isSubmitting || !form.formState.isDirty
                }
              >
                <RefreshCwIcon />
                {t('onboarding-overview:documentRequest.resetForm')}
              </Button>
            </div>

            <ServerErrorAlert
              error={uploadMutation.error ?? submitMutation.error}
            />
          </div>
        </MaintenancePageBody>

        <MaintenanceFormFooter
          leading={
            <Button
              type="button"
              variant="outlineSurface"
              size="sm"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              {t('approved-client-maintenance:document.cancel')}
            </Button>
          }
          trailing={
            <Button
              type="submit"
              size="sm"
              disabled={form.formState.isSubmitting || !isReady}
            >
              {form.formState.isSubmitting
                ? t(
                    'onboarding-overview:documentUpload.documentUploadForm.uploadingDocuments'
                  )
                : !isReady
                  ? t(
                      'onboarding-overview:documentUpload.documentUploadForm.completeAllRequired'
                    )
                  : t(
                      'onboarding-overview:documentUpload.documentUploadForm.uploadDocuments'
                    )}
            </Button>
          }
        />
      </form>
    </Form>
  );
}
