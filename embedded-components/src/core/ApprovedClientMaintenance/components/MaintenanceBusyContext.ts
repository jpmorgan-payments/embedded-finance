import { createContext, useContext } from 'react';

const MaintenanceBusyContext = createContext(false);

/** True while a change is saving, so navigation away from the current task pauses. */
export const MaintenanceBusyProvider = MaintenanceBusyContext.Provider;

export const useIsMaintenanceBusy = () => useContext(MaintenanceBusyContext);
