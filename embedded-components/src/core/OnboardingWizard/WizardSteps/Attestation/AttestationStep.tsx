/* eslint react/prop-types: 0 */
import { useEffect, useState } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { useFormContext } from 'react-hook-form';

import {
  useGetDocumentDetails,
  useSmbdoDownloadDocument,
  useSmbdoGetAllDocumentDetails,
  useSmbdoPostClientVerifications,
} from '@/api/generated/embedded-banking';
import { useToast } from '@/components/ui/use-toast';
// import { ListDocumentsResponse } from '@/api/generated/embedded-banking.schemas';
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Group,
  Label,
  Stack,
  Text,
  Title,
} from '@/components/ui';
import { useRootConfig } from '@/core/EBComponentsProvider/RootConfigProvider';
import { useOnboardingForm } from '@/core/OnboardingWizard/context/form.context';

import NavigationButtons from '../../Stepper/NavigationButtons';
// eslint-disable-next-line
import { useStepper } from '../../Stepper/useStepper';
// import { fromApiToForm } from '../../utils/fromApiToForm';
import { useContentData } from '../../utils/useContentData';
import { useGetDataByClientId } from '../hooks';

// import { PdfDisplay } from './PdfDisplay';

const AttestationStep = () => {
  const { toast } = useToast();
  const form = useFormContext();
  const [TAC, setTAC] = useState(false);
  // const [EDC, setEDC] = useState(false);
  const [check, setCheck] = useState(false);

  const [termsAgreed, setTermsAgreed] = useState({
    useOfAccount: false,
    dataAccuracy: false,
    termsAndConditions: false,
  });

  const allTermsAgreed = Object.values(termsAgreed).every(Boolean);
  const canSubmit = allTermsAgreed && TAC;

  const handleTermsChange =
    (term: keyof typeof termsAgreed) => (checked: boolean) => {
      setTermsAgreed((prev) => ({ ...prev, [term]: checked }));
    };

  const {
    mutate: postVerification,
    isError,
    data,
    isPending,
  }: any = useSmbdoPostClientVerifications({
    mutation: {
      onSuccess: () => {
        toast({
          title: 'Oboarding Complete',
          description: 'Attestion submmited. Thank you.',
        });
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'ERROR',
          description: 'Something went wrong. Please try again later.',
        });
      },
    },
  });

  const { clientId } = useRootConfig();
  const { setCurrentStep, activeStep } = useStepper();

  // TODO: REmove the onboardingForm
  const { onboardingForm }: any = useOnboardingForm();
  const [doc, setDocs] = useState<any>(null);
  const { data: clientData } = useGetDataByClientId();

  const { data: DocumentDetail } = useGetDocumentDetails(
    clientData?.outstanding.attestationDocumentIds?.[0] ?? ''
  );
  // const { data: clientData } = useSmbdoGetClient(
  //   (clientId || onboardingForm?.id) as string
  // );

  // TODO: we need to list this?
  // @ts-ignore
  const termsAndConditionsDocId = DocumentDetail?.documentDetails?.find(
    (item: any) => item.documentType === 'TERMS_CONDITIONS'
  )?.id;
  // const disclosureAndConsentDocId = verifications?.documentDetails?.find(
  //   (item: any) => item.documentType === 'DISCLOSURE_AND_CONSENT'
  // )?.documentId;
  const { getContentToken } = useContentData('steps.VerificationsStep');
  console.log(
    '@@verifications',
    clientData,
    DocumentDetail,
    '>>',
    termsAndConditionsDocId
  );

  const { data: disclosureAndConsentDoc } = useSmbdoDownloadDocument(
    termsAndConditionsDocId ?? ''
  );

  useEffect(() => {
    if (disclosureAndConsentDoc) {
      console.log('@@disclosureAndConsentDoc', disclosureAndConsentDoc);
      // @ts-ignore
      const newBlob = new Blob([disclosureAndConsentDoc], {
        type: 'application/pdf',
      });
      const urlBlob = URL.createObjectURL(newBlob);

      setDocs(urlBlob);
    }
  }, [disclosureAndConsentDoc]);

  // const [pdfLoaded, setPdfLoaded] = useState(false);

  // Update form scema for questions after load
  // useEffect(() => {
  //   if (isSuccess) {
  //     updateSchema(yupObject);
  //   }
  // }, [isSuccess]);

  const onSubmit = () => {
    postVerification({ id: clientId ?? '' });
  };

  // const organizationType =
  //   clientDataForm?.onganizationDetails?.orgDetails?.organizationType;
  // const businessName =
  //   clientDataForm?.onganizationDetails?.orgDetails?.businessName;

  return (
    <section>
      <Title as="h2">{getContentToken(`title`)}</Title>
      <Text>{getContentToken(`text`)}</Text>

      {isError && <>{JSON.stringify(data?.context[0]?.message)}</>}

      {/* <PdfDisplay
        data-testid="pdf-display"
        // file={termsAndConditionsDocId}

        file={isMock ? '/asset/docs/terms.pdf' : termsAndConditionsDocId}
        onLoad={() => setPdfLoaded(true)}
        onScrolledToBottom={() => {
          if (pdfLoaded) {
            form.setValue('reviewedTerms', true);
          }
        }}
      /> */}

      {/* <Separator /> */}

      {/* <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)}> */}

      <Stack className="eb-mt-4 eb-pl-6">
        <ul className="eb-list-outside  eb-space-y-2">
          <li>
            <Checkbox
              id="useOfAccount"
              checked={termsAgreed.useOfAccount}
              onCheckedChange={handleTermsChange('useOfAccount')}
              className="eb-mr-4 eb-mt-2"
            />
            <Label
              htmlFor="useOfAccount"
              className="eb-peer-disabled:eb-cursor-not-allowed eb-peer-disabled:eb-opacity-70 eb-text-sm eb-leading-none"
            >
              The Embedded Payment Account may only be used to receive funds
              through [the Platform] pursuant to [my Commerce Terms with the
              Platform] and I am appointing [the Platform] as my agent for the
              Account.
            </Label>
          </li>
          <li>
            <Checkbox
              id="dataAccuracy"
              checked={termsAgreed.dataAccuracy}
              onCheckedChange={handleTermsChange('dataAccuracy')}
              className="eb-mr-4 eb-mt-2"
            />
            <Label
              htmlFor="dataAccuracy"
              className="eb-peer-disabled:eb-cursor-not-allowed eb-peer-disabled:eb-opacity-70 eb-text-sm eb-leading-none"
            >
              The data I am providing is true, accurate, current and complete to
              the best of my knowledge.
            </Label>
          </li>
          <li>
            {doc && (
              <Group>
                <Checkbox
                  id="termsAndConditions"
                  checked={termsAgreed.termsAndConditions}
                  onCheckedChange={handleTermsChange('termsAndConditions')}
                  disabled={!TAC}
                  className="eb-mr-4 eb-mt-2"
                />
                I have read and agree to the &nbsp;
                <a
                  className={`eb-underline eb-decoration-primary eb-underline-offset-4 ${TAC && 'eb-decoration-transparent'}`}
                  href={doc}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    setTAC(true);
                  }}
                >
                  <Group>
                    J.P. Morgan Embedded Payment Terms & Conditions,
                    <IconExternalLink size={12} />
                  </Group>
                </a>
                {/* &nbsp;
              <a
                className={`eb-underline eb-decoration-primary eb-underline-offset-4 ${EDC && 'eb-decoration-transparent'}`}
                href="https://www.jpmorganchase.com/legal/terms-and-conditions"
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  setEDC(true);
                }}
              >
                <Group>
                  the E-Sign Disclosure and Consent,
                  <IconExternalLink size={12} />
                </Group>
              </a> */}
                and the certifications directly above.
              </Group>
            )}
          </li>
        </ul>
        <p className="eb-text-sm eb-text-muted-foreground eb-ml-8">
          Please open the documents links to enable the terms and conditions
          checkbox.
        </p>
      </Stack>
      <Stack className="eb-mt-10">
        {/* <FormField
          control={form.control}
          name="attestedAuthorized"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={() => {
                    setCheck(true);
                  }}
                  disabled={!TAC}
                />
              </FormControl>
              <FormLabel className="eb-p-3">
                By checking the box, I acknowledge and agree to the above:
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        /> */}
      </Stack>
      <Text>{form.getValues().error}</Text>

      <NavigationButtons
        setActiveStep={setCurrentStep}
        activeStep={activeStep}
        disabled={!canSubmit || isPending}
        onSubmit={() => {
          onSubmit();
        }}
      >
        {!canSubmit
          ? 'Please agree to all terms and review all documents'
          : 'Submit'}
      </NavigationButtons>
      {/* </form>
      </Form> */}
    </section>
  );
};

AttestationStep.title = 'Attestation';

export { AttestationStep };
