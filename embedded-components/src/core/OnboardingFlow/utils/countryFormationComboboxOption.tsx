import type { ReactElement, ReactNode } from 'react';

export type CountryFormationComboboxOption = {
  value: string;
  searchValue: string;
  label: ReactElement;
};

type CountryI18nCallbacks = {
  /**
   * Display label (may wrap with content tokens). Uses a loose signature so
   * i18next `TFunction` / token-wrapped `t` can be passed without overload friction.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label: (...args: any[]) => ReactNode;
  /** Plain string for cmdk filtering — use i18next plain `t` output, never `String(t)` on React nodes. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterText: (...args: any[]) => string;
};

/**
 * Builds combobox options for ISO country codes so cmdk filtering matches both
 * the alpha-2 code and the localized country name.
 */
export function mapCountriesOfFormationToComboboxOptions(
  codes: readonly string[],
  { label, filterText }: CountryI18nCallbacks
): CountryFormationComboboxOption[] {
  return codes.map((code) => {
    const name = filterText(`countries.${code}`, {
      ns: 'common',
      defaultValue: code,
    }).trim();

    const displayName = name || code;
    const searchValue = `[${code}] ${displayName}`;

    return {
      value: code,
      searchValue,
      label: (
        <span>
          <span className="eb-font-medium">[{code}]</span>{' '}
          {label(`countries.${code}`, {
            ns: 'common',
            defaultValue: displayName,
          })}
        </span>
      ),
    };
  });
}
