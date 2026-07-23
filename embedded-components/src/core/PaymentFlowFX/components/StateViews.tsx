/**
 * Presentational state views for PaymentFlowFX (loading / empty / fatal error).
 *
 * These mirror the private views in PaymentFlow.tsx. They are reimplemented here
 * (rather than imported) because the originals are not exported, and this keeps
 * PaymentFlowFX self-contained per the non-breaking mandate.
 */
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading state shown while accounts are being fetched. Mirrors the
 * stepper layout for a seamless transition.
 */
export function LoadingStateView() {
  return (
    <div className="eb-space-y-1">
      <div className="eb-relative">
        <div className="eb-absolute eb-left-[15px] eb-top-[40px] eb-h-[calc(100%-28px)] eb-w-px eb-bg-border/50" />
        <div className="eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2">
          <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0 eb-rounded-full" />
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <Skeleton className="eb-h-5 eb-w-12" />
            <Skeleton className="eb-h-4 eb-w-14" />
          </div>
        </div>
        <div className="eb-ml-11 eb-pb-4 eb-pt-1">
          <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
            <div className="eb-flex eb-w-full eb-items-center eb-justify-between eb-p-3">
              <div className="eb-space-y-1.5">
                <div className="eb-flex eb-items-center eb-gap-2">
                  <Skeleton className="eb-h-4 eb-w-28" />
                  <Skeleton className="eb-h-4 eb-w-16" />
                </div>
                <Skeleton className="eb-h-3 eb-w-20" />
              </div>
              <div className="eb-space-y-1 eb-text-right">
                <Skeleton className="eb-ml-auto eb-h-4 eb-w-20" />
                <Skeleton className="eb-ml-auto eb-h-3 eb-w-14" />
              </div>
            </div>
            <div className="eb-border-t eb-border-border" />
            <div className="eb-flex eb-w-full eb-items-center eb-justify-between eb-p-3">
              <div className="eb-space-y-1.5">
                <div className="eb-flex eb-items-center eb-gap-2">
                  <Skeleton className="eb-h-4 eb-w-24" />
                  <Skeleton className="eb-h-4 eb-w-16" />
                </div>
                <Skeleton className="eb-h-3 eb-w-16" />
              </div>
              <div className="eb-space-y-1 eb-text-right">
                <Skeleton className="eb-ml-auto eb-h-4 eb-w-24" />
                <Skeleton className="eb-ml-auto eb-h-3 eb-w-14" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="eb-relative">
        <div className="eb-absolute eb-left-[15px] eb-top-[40px] eb-h-[calc(100%-28px)] eb-w-px eb-bg-border/50" />
        <div className="eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2">
          <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0 eb-rounded-full" />
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <Skeleton className="eb-h-5 eb-w-8" />
            <Skeleton className="eb-h-4 eb-w-28 eb-opacity-50" />
          </div>
        </div>
      </div>

      <div className="eb-relative">
        <div className="eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2">
          <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0 eb-rounded-full" />
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <Skeleton className="eb-h-5 eb-w-28" />
            <Skeleton className="eb-h-4 eb-w-24 eb-opacity-50" />
          </div>
        </div>
      </div>

      <Separator className="!eb-my-4" />

      <div className="eb-space-y-4">
        <div>
          <Skeleton className="eb-mb-1.5 eb-h-4 eb-w-14" />
          <Skeleton className="eb-h-10 eb-w-full eb-rounded-md" />
        </div>
        <div>
          <div className="eb-mb-1.5 eb-flex eb-items-center eb-justify-between">
            <Skeleton className="eb-h-4 eb-w-20" />
            <Skeleton className="eb-h-3 eb-w-16" />
          </div>
          <Skeleton className="eb-h-20 eb-w-full eb-rounded-md" />
        </div>
      </div>
    </div>
  );
}

interface EmptyAccountsViewProps {
  title: string;
  message: string;
  onClose?: () => void;
}

/** Shown when the accounts fetch succeeds but there are no usable accounts. */
export function EmptyAccountsView({
  title,
  message,
  onClose,
}: EmptyAccountsViewProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  return (
    <div className="eb-flex eb-h-full eb-flex-col eb-items-center eb-justify-center eb-pb-[15%] eb-text-center">
      <div className="eb-mb-4 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
        <AlertCircle className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
      </div>
      <h2 className="eb-mb-2 eb-text-xl eb-font-semibold eb-text-foreground">
        {title}
      </h2>
      <p className="eb-mb-6 eb-max-w-sm eb-text-muted-foreground">{message}</p>
      {onClose && (
        <Button
          onClick={onClose}
          variant="outline"
          className="eb-min-w-[140px]"
        >
          {t('fx.close', 'Close')}
        </Button>
      )}
    </div>
  );
}

interface FatalErrorViewProps {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

/** Full-panel error shown when critical data (accounts) fails to load. */
export function FatalErrorView({
  title,
  message,
  onRetry,
  isRetrying = false,
}: FatalErrorViewProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  return (
    <div className="eb-flex eb-h-full eb-flex-col eb-items-center eb-justify-center eb-pb-[15%] eb-text-center">
      <div className="eb-mb-4 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
        <AlertCircle className="eb-h-8 eb-w-8 eb-text-destructive" />
      </div>
      <h2 className="eb-mb-2 eb-text-xl eb-font-semibold eb-text-foreground">
        {title}
      </h2>
      <p className="eb-mb-6 eb-max-w-sm eb-text-muted-foreground">{message}</p>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        variant="outline"
        className="eb-min-w-[140px]"
      >
        {isRetrying ? (
          <>
            <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4 eb-animate-spin" />
            {t('fx.retrying', 'Retrying...')}
          </>
        ) : (
          <>
            <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4" />
            {t('fx.tryAgain', 'Try Again')}
          </>
        )}
      </Button>
    </div>
  );
}
