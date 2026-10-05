import { createContext, useContext } from 'react';

const MaintenanceNavigatorVisibleContext = createContext(false);

export const MaintenanceNavigatorVisibleProvider =
  MaintenanceNavigatorVisibleContext.Provider;

export const useIsMaintenanceNavigatorVisible = () =>
  useContext(MaintenanceNavigatorVisibleContext);
