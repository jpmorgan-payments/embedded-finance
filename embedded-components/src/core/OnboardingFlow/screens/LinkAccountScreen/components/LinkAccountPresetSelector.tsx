import { useTranslationWithTokens } from '@/i18n';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LinkAccountPresetEntry } from '@/core/OnboardingFlow/types/onboarding.types';

type LinkAccountPresetSelectorProps = {
  presets: readonly LinkAccountPresetEntry[];
  value: string | undefined;
  onChange: (value: string) => void;
};

export function LinkAccountPresetSelector({
  presets,
  value,
  onChange,
}: LinkAccountPresetSelectorProps) {
  const { t } = useTranslationWithTokens(['onboarding-overview']);

  if (presets.length <= 1) return null;

  return (
    <div className="eb-mb-4">
      <label
        htmlFor="link-account-preset-select"
        className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
      >
        {t(
          'screens.linkAccount.presetSelector.label',
          'Select account to link'
        )}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="link-account-preset-select"
          data-testid="preset-account-select"
        >
          <SelectValue
            placeholder={t(
              'screens.linkAccount.presetSelector.placeholder',
              'Choose an account'
            )}
          />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset, idx) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.label ??
                (preset.initialValues.firstName
                  ? `${preset.initialValues.firstName} ${preset.initialValues.lastName ?? ''}`.trim()
                  : (preset.initialValues.businessName ??
                    t(
                      'screens.linkAccount.presetSelector.defaultLabel',
                      'Account {{index}}',
                      { index: idx + 1 }
                    )))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
