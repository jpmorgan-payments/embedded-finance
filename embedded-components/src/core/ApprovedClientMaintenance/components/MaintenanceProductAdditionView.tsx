import { useTranslationWithTokens } from '@/i18n';
import { ArrowLeftIcon, Loader2Icon, PackagePlusIcon } from 'lucide-react';

import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button } from '@/components/ui';

import { MaintenanceFormFooter } from './MaintenanceFormFooter';

export function MaintenanceProductAdditionView({
  isSubmitting,
  error,
  onBack,
  onConfirm,
}: {
  isSubmitting: boolean;
  error?: unknown;
  onBack: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');

  return (
    <div className="eb-component eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-p-5">
        <div className="eb-flex eb-items-center eb-gap-3">
          <PackagePlusIcon
            className="eb-size-6 eb-shrink-0 eb-text-primary"
            aria-hidden="true"
          />
          <h2 className="eb-text-lg eb-font-semibold">
            {t('productAddition.title')}
          </h2>
        </div>
        <p className="eb-mt-2 eb-max-w-2xl eb-text-sm eb-text-muted-foreground">
          {t('productAddition.description')}
        </p>
      </header>
      {error ? (
        <div className="eb-border-b eb-p-5">
          <ServerErrorAlert error={error as never} />
        </div>
      ) : null}
      <div>
        <section
          aria-labelledby="product-addition-about-heading"
          className="eb-px-5 eb-py-5"
        >
          <h3
            id="product-addition-about-heading"
            className="eb-text-sm eb-font-semibold"
          >
            {t('productAddition.aboutTitle')}
          </h3>
          <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-6 eb-text-muted-foreground">
            {t('productAddition.paymentsDescription')}
          </p>
        </section>
        <section
          aria-labelledby="product-addition-next-heading"
          className="eb-border-t eb-bg-muted/10 eb-px-5 eb-py-4"
        >
          <h3
            id="product-addition-next-heading"
            className="eb-text-sm eb-font-semibold"
          >
            {t('productAddition.nextTitle')}
          </h3>
          <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
            {t('productAddition.nextDescription')}
          </p>
        </section>
      </div>
      <MaintenanceFormFooter
        leading={
          <Button
            variant="outlineSurface"
            size="sm"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeftIcon />
            {t('productAddition.back')}
          </Button>
        }
        trailing={
          <Button
            size="sm"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="eb-animate-spin" />
            ) : (
              <PackagePlusIcon />
            )}
            {t('productAddition.confirm')}
          </Button>
        }
      />
    </div>
  );
}
