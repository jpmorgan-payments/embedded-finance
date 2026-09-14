import { useEffect, useRef } from 'react';

export function useAddressCountryReset(
  country: unknown,
  resetDependentFields: () => void
) {
  const isInitialCountryRender = useRef(true);

  useEffect(() => {
    if (isInitialCountryRender.current) {
      isInitialCountryRender.current = false;
      return;
    }
    resetDependentFields();
    // Reset only when country changes. Callers pass closures over their current
    // form/path context, which must not turn this into an every-render effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);
}
