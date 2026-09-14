import { useMemo, useState } from 'react';

import type { MaintenanceBreadcrumbItem } from '../components/MaintenanceBreadcrumb';

export function useMaintenanceFormExitGuard(
  breadcrumbs: MaintenanceBreadcrumbItem[],
  onBack: () => void
) {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingExit, setPendingExit] = useState<(() => void) | undefined>();

  const requestExit = (exit: () => void) => {
    if (!isDirty) {
      exit();
      return;
    }
    setPendingExit(() => exit);
  };

  const guardedBreadcrumbs = useMemo(
    () =>
      breadcrumbs.map((item) =>
        item.onSelect
          ? {
              ...item,
              onSelect: () => requestExit(item.onSelect!),
            }
          : item
      ),
    // requestExit intentionally reads current dirty state each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [breadcrumbs, isDirty]
  );

  return {
    guardedBreadcrumbs,
    isExitConfirmationOpen: Boolean(pendingExit),
    onDirtyChange: setIsDirty,
    requestBack: () => requestExit(onBack),
    keepEditing: () => setPendingExit(undefined),
    discardAndExit: () => {
      const exit = pendingExit;
      setPendingExit(undefined);
      exit?.();
    },
  };
}
