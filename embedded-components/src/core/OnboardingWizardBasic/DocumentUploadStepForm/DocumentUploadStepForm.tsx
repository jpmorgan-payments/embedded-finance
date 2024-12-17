import { Fragment, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useSmbdoGetClient,
  useSmbdoListDocumentRequests,
} from '@/api/generated/smbdo';
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

  const DEMO = true;

  // Fetch document requests
  // eslint-disable-next-line prefer-const
  let { data: documentRequestsData, status: documentRequestsStatus } =
    useSmbdoListDocumentRequests({ clientId: clientId ?? '' });

  useEffect(() => {
    if (documentRequestsData && documentRequestsStatus === 'success') {
      // clientData.outstanding.documentRequestIds
    }
  }, [documentRequestsData, documentRequestsStatus]);

  if (DEMO) {
    documentRequestsData = {
      documentRequests: [
        {
          id: '50006',
          country: 'US',
          createdAt: '2022-11-18T12:28:11.232Z',
          description: 'Please provide documents:\n - Signature Card',
          requirements: [
            {
              documentTypes: ['SIGNATURE_CARD'],
              level: 'PRIMARY',
              minRequired: 1,
            },
          ],
          outstanding: {
            documentTypes: ['SIGNATURE_CARD'],
          },
          partyId: '2001133071',
          status: 'ACTIVE',
          updatedAt: '2022-11-18T12:28:11.232Z',
          validForDays: 120,
        },
      ],
      metadata: {
        page: 0,
        limit: 25,
        total: 1,
      },
    };
  }

  // zod schema, dynamically generated based on the document types
  const DocumentUploadSchema = useMemo(() => {
    const schema: Record<string, z.ZodType<any>> = {};
    documentRequestsData?.documentRequests.forEach((documentRequest) => {
      if (!documentRequest.id) {
        return;
      }
      const nestedSchema: Record<string, z.ZodType<any>> = {};
      documentRequest.requirements?.forEach((requirement) => {
        const documentType = requirement.documentTypes[0];
        nestedSchema[documentType] = z
          .array(z.instanceof(File))
          .nonempty('Document is required');
      });
      schema[documentRequest.id] = z.object(nestedSchema);
    });
    return z.object(schema);
  }, [JSON.stringify(documentRequestsData)]);

  const form = useForm<z.infer<typeof DocumentUploadSchema>>({
    resolver: zodResolver(DocumentUploadSchema),
  });

  const onSubmit = form.handleSubmit((values) => {
    console.log(values);
    nextStep();
  });

  if (documentRequestsStatus === 'pending') {
    return <FormLoadingState message="Fetching document requests..." />;
  }

  if (documentRequestsData?.documentRequests.length === 0 && !DEMO) {
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
        {documentRequestsData?.documentRequests.map((documentRequest) => {
          const matchedParty = clientData?.parties?.find(
            (party) => party.id === documentRequest.partyId
          );
          return (
            <Fragment key={documentRequest.id}>
              <div>
                <p className="eb-text-sm eb-font-bold">
                  Document request for:{' '}
                  <span className="eb-font-normal eb-underline eb-underline-offset-2">
                    {matchedParty?.organizationDetails?.organizationName ??
                      [
                        matchedParty?.individualDetails?.firstName,
                        matchedParty?.individualDetails?.middleName,
                        matchedParty?.individualDetails?.lastName,
                      ].join(' ') ??
                      'N/A'}
                  </span>{' '}
                  <span className="eb-text-xs eb-font-normal eb-lowercase eb-text-muted-foreground">
                    ({matchedParty?.roles?.join(', ')})
                  </span>
                </p>
                {documentRequest.description?.split('\n').map((item, key) => (
                  <p key={key} className="eb-text-sm eb-font-semibold">
                    {item}
                  </p>
                ))}
              </div>
              <Separator />
              {documentRequest.requirements?.map((requirement, index) => {
                const documentType = requirement.documentTypes[0];
                return (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`${documentRequest.id}.${documentType}`}
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
