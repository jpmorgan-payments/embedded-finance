import { get } from 'lodash';

import {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/embedded-banking.schemas';
import { Group, Stack, Title } from '@/components/ui';

import NavigationButtons from '../../Stepper/NavigationButtons';
// eslint-disable-next-line
import { useStepper } from '../../Stepper/useStepper';
import { useGetDataByClientId } from '../hooks';
import { reviewSchema } from '../StepsSchema';
import { individualFields, organizationFields } from './partyFields';

const ReviewStep = () => {
  // const { getContentToken } = useContentData('steps.ReviewStep');

  const { setCurrentStep, activeStep } = useStepper();

  const { data, isPending } = useGetDataByClientId('client');

  const clientData: ClientResponse = data;

  const renderParty = (
    party: PartyResponse,
    fields: { label: any; path: any }[]
  ) => (
    <div key={party.id} className="eb-mb-4 eb-p-4">
      <h2 className="eb-mb-4 eb-text-xl eb-font-bold">{party.partyType}</h2>
      <dl className="eb-space-y-2">
        {fields.map(({ label, path }) => {
          const value = get(party, path);
          if (value !== undefined && value !== null) {
            return (
              <div
                key={path}
                className="eb-flex eb-border-b eb-border-dotted eb-border-gray-300 eb-pb-1 sm:eb-justify-between"
              >
                <dt className="eb-w-1/3 sm:eb-mb-0">{label}:</dt>
                <dd className="sm:pl-4  sm:eb-w-2/3">
                  {typeof value === 'boolean'
                    ? value.toString()
                    : Array.isArray(value)
                      ? value.join(', ')
                      : value}
                </dd>
              </div>
            );
          }
          return null;
        })}
      </dl>
    </div>
  );

  return (
    <>
      <Stack className="eb-w-full">
        <Title as="h2">Review</Title>
        <Group className="eb-my-4">
          <Title as="h5">STATUS: &nbsp;</Title>
          <Title as="h5" className="eb-text-green-500">
            {data?.status}
          </Title>
        </Group>
        <div className="eb-w-xl eb-px-4">
          {clientData?.parties?.map((party) =>
            party.partyType === 'ORGANIZATION'
              ? renderParty(party, organizationFields)
              : renderParty(party, individualFields)
          )}
        </div>

        <NavigationButtons
          setActiveStep={setCurrentStep}
          activeStep={activeStep}
          disabled={isPending}
          onSubmit={() => {
            setCurrentStep(activeStep + 1);
          }}
        />
      </Stack>
    </>
  );
};

ReviewStep.title = 'Review';
ReviewStep.validationSchema = reviewSchema;

export { ReviewStep };
