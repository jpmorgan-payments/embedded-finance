import { Fragment, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  smbdoGetDocumentRequest,
  useSmbdoGetClient,
} from '@/api/generated/smbdo';
import { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';
import Dropzone from '@/components/ui/dropzone';
import { useStepper } from '@/components/ui/stepper';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Separator,
} from '@/components/ui';

import { FormActions } from '../FormActions/FormActions';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { DOCUMENT_TYPE_MAPPING } from '../utils/documentTypeMapping';

export const DocumentUploadStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId } = useOnboardingContext();

  // Fetch client data
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

  const partiesDocumentRequests = clientData?.parties
    ?.map((p) => p?.validationResponse?.map((v) => v?.documentRequestIds))
    ?.flat(2)
    ?.filter((v) => v?.length)
    .concat(clientData?.outstanding?.documentRequestIds);

  const documentRequestsQueries = useQueries({
    queries: (partiesDocumentRequests ?? []).map((documentRequestId) => ({
      queryKey: ['documentRequest', documentRequestId],
      queryFn: () =>
        documentRequestId && smbdoGetDocumentRequest(documentRequestId), // Ensure this returns a promise
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data) as DocumentRequestResponse[],
        pending: results.some((result) => result.isPending),
      };
    },
  });

  // zod schema, dynamically generated based on the document types
  const DocumentUploadSchema = useMemo(() => {
    const schema: Record<string, z.ZodType<any>> = {};
    documentRequestsQueries?.data?.forEach((documentRequest) => {
      if (!documentRequest?.id) {
        return;
      }
      const nestedSchema: Record<string, z.ZodType<any>> = {};
      documentRequest?.requirements?.forEach((requirement) => {
        const documentType = requirement.documentTypes[0];
        nestedSchema[documentType] = z
          .array(z.instanceof(File))
          .nonempty('Document is required');
      });
      schema[documentRequest.id] = z.object(nestedSchema);
    });
    return z.object(schema);
  }, [JSON.stringify(documentRequestsQueries?.data)]);

  const form = useForm<z.infer<typeof DocumentUploadSchema>>({
    resolver: zodResolver(DocumentUploadSchema),
  });

  const onSubmit = form.handleSubmit((values) => {
    console.log(values);
    nextStep();
  });

  if (documentRequestsQueries?.pending) {
    return <FormLoadingState message="Fetching document requests..." />;
  }

  if (documentRequestsQueries?.data?.length === 0) {
    return (
      <Form {...form}>
        <form
          onSubmit={nextStep}
          className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1"
        >
          <p className="eb-text-sm">
            No document requests found. Please proceed to the next step.
          </p>
          <FormActions />
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1"
      >
        {documentRequestsQueries?.data?.map((documentRequest) => {
          return (
            <Fragment key={documentRequest?.id}>
              <div className="eb-border-l-4 eb-border-yellow-500 eb-bg-yellow-100 eb-p-4 eb-text-yellow-700">
                {documentRequest?.description?.split('\n').map((item, key) => (
                  <p key={key} className="eb-text-sm">
                    {item}
                  </p>
                ))}
              </div>
              <Separator />
              {documentRequest?.requirements?.map((requirement, index) => {
                const documentType = requirement.documentTypes[0];
                return (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`${documentRequest?.id}.${documentType}`}
                    render={({ field: { onChange, ...fieldProps } }) => {
                      return (
                        <>
                          <FormItem>
                            <FormLabel asterisk>
                              {DOCUMENT_TYPE_MAPPING[documentType].label}
                            </FormLabel>
                            <FormDescription>
                              {DOCUMENT_TYPE_MAPPING[documentType].description}
                            </FormDescription>
                            <FormControl>
                              <Dropzone
                                containerClassName="eb-max-w-xl"
                                {...fieldProps}
                                multiple={(requirement.minRequired ?? 0) > 1}
                                accept={{
                                  'application/pdf': ['.pdf'],
                                }}
                                onChange={onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>

                          <Separator />
                        </>
                      );
                    }}
                  />
                );
              })}
            </Fragment>
          );
        })}

        <FormActions />
      </form>
    </Form>
  );
};
