/**
 * FR-FX-10: "Recipient's account currency" selector for cross-border create.
 */
import { useTranslationWithTokens } from '@/i18n';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CurrencyFlag } from './CurrencyFlag';
import { FxRailDisclaimer } from './FxRailDisclaimer';

export interface RecipientAccountCurrencySelectProps {
  value: string;
  onValueChange: (currency: string) => void;
  /** Non-USD currencies offered in the dropdown (USD is always listed first). */
  supportedCurrencies?: string[];
  /** Optional map of currency code ⇒ display name (e.g. `{ EUR: 'Euro' }`). */
  currencyLabels?: Record<string, string>;
}

/**
 * Currency select used when creating an international (FX) recipient.
 * Choosing a non-USD currency shows the FX rail disclaimer.
 */
export function RecipientAccountCurrencySelect({
  value,
  onValueChange,
  supportedCurrencies,
  currencyLabels,
}: RecipientAccountCurrencySelectProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  const isInternational = value !== 'USD';

  return (
    <div className="eb-rounded-lg eb-border eb-bg-card eb-p-4">
      <label
        htmlFor="fx-account-currency"
        className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
      >
        {t(
          'bankAccountForm.accountCurrencyLabel',
          "Recipient's account currency"
        )}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="fx-account-currency" className="eb-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">
            {t(
              'bankAccountForm.accountCurrencyDomestic',
              'USD — US Dollar (domestic)'
            )}
          </SelectItem>
          {(supportedCurrencies ?? []).map((cur) => (
            <SelectItem key={cur} value={cur}>
              <span className="eb-flex eb-items-center eb-gap-2">
                <CurrencyFlag currency={cur} />
                <span>
                  {currencyLabels?.[cur]
                    ? `${cur} — ${currencyLabels[cur]}`
                    : cur}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInternational && (
        <div className="eb-mt-3">
          <FxRailDisclaimer currency={value} />
        </div>
      )}
    </div>
  );
}
