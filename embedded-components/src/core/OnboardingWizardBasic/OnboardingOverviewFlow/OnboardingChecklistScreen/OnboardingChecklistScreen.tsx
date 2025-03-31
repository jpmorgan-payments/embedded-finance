// import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';

// import { ORGANIZATION_TYPE_LIST } from '../../utils/organizationTypeList';
// import { useOnboardingOverviewContext } from '../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../OnboardingGlobalStepper';

export const OnboardingChecklistScreen = () => {
  // const { clientData } = useOnboardingOverviewContext();

  const globalStepper = GlobalStepper.useStepper();

  // const { t } = useTranslation(['onboarding', 'common']);

  // const existingOrgParty = clientData?.parties?.find(
  //   (party) => party.partyType === 'ORGANIZATION'
  // );

  // const organizationType =
  //   existingOrgParty?.organizationDetails?.organizationType;

  return (
    <div className="eb-flex eb-min-h-full eb-flex-col eb-space-y-8">
      <div className="eb-flex-auto eb-space-y-4">
        <div className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <h3 className="eb-text-xl eb-font-bold eb-tracking-tight">
            Personal Details
          </h3>

          <div className="eb-space-y-1">
            <p className="eb-font-semibold">
              We&apos;ll need information from you as the financial controller
              responsible for managing finances for your company.
            </p>
            <ul className="eb-list-disc eb-pl-8">
              <li>Data point A</li>
              <li>Data point B</li>
              <li>Data point C</li>
            </ul>
          </div>
        </div>

        <div className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <h3 className="eb-text-xl eb-font-bold eb-tracking-tight">Company</h3>

          <div className="eb-space-y-1">
            <p className="eb-font-semibold">
              Collect pertinent company details, typically found on your
              company&apos;s registration certificate.
            </p>
            <ul className="eb-list-disc eb-pl-8">
              <li>Data point A</li>
              <li>Data point B</li>
              <li>Data point C</li>
            </ul>
          </div>
        </div>

        <div className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
          <h3 className="eb-text-xl eb-font-bold eb-tracking-tight">
            Stakeholders
          </h3>

          <p className="eb-font-semibold">
            Collect personal details for all stakeholders in your company.
          </p>

          <div className="eb-space-y-1">
            <p className="eb-font-semibold">Controllers</p>
            <ul className="eb-list-disc eb-pl-8">
              <li>Data point A</li>
              <li>Data point B</li>
              <li>Data point C</li>
            </ul>
          </div>

          <div className="eb-space-y-1">
            <p className="eb-font-semibold">Beneficial owners</p>
            <ul className="eb-list-disc eb-pl-8">
              <li>Data point A</li>
              <li>Data point B</li>
              <li>Data point C</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="eb-flex eb-justify-between eb-gap-4">
        <Button
          variant="outline"
          size="lg"
          className="eb-w-full eb-text-lg"
          onClick={() => globalStepper.prev()}
        >
          Back
        </Button>
        <Button
          size="lg"
          className="eb-w-full eb-text-lg"
          onClick={() => globalStepper.next()}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
