import { useTranslation } from '@/i18n/useTranslation';
import { AlertTriangle } from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MissingPartyFields = ({ party }: { party: PartyResponse }) => {
  const { t } = useTranslation();

  const validationResponseFields = party?.validationResponse?.filter((r) => {
    const needsInfo = r.validationStatus === 'NEEDS_INFO';
    return needsInfo;
  })?.[0]?.fields;

  if (!validationResponseFields?.length) {
    return null;
  }

  return (
    <Alert
      variant="default"
      className="eb-mt-2 eb-w-full eb-border-yellow-100 eb-bg-yellow-50"
    >
      <div className="eb-flex eb-gap-3">
        <AlertTriangle className="eb-h-5 eb-w-5 eb-text-yellow-500" />
        <AlertDescription className="eb-flex eb-flex-col">
          <span className="eb-font-semibold eb-text-yellow-800">
            {t('onboarding:missingPartyFields.title')}
          </span>
          <span className="eb-text-yellow-800">
            {t('onboarding:missingPartyFields.description')}
            <ul className="eb-mt-1 eb-list-inside eb-list-disc">
              {validationResponseFields.map((field, index) => (
                <li key={index} className="eb-text-yellow-800">
                  {t(`onboarding:fields.${field.name}.label`)}
                </li>
              ))}
            </ul>
          </span>
        </AlertDescription>
      </div>
    </Alert>
  );
};
