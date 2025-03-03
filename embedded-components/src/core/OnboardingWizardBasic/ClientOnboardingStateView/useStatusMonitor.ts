import { useEffect, useRef } from 'react';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ClientStatus } from '@/api/generated/smbdo.schemas';

export function useClientStatusMonitor(
  clientId: string,
  onStatusChange: (prevStatus: ClientStatus, newStatus: ClientStatus) => void
) {
  const previousClientStatusRef = useRef<ClientStatus | null>(null);

  const { data: clientData } = useSmbdoGetClient(clientId ?? '', {
    query: {
      refetchInterval: 5000, // Poll every 5 seconds
      refetchIntervalInBackground: true, // This is crucial - continues polling when tab is inactive
      refetchOnWindowFocus: true,
    },
  });

  const currentClientStatus = clientData?.status;

  useEffect(() => {
    // Skip initial render or when there's no data yet
    if (!currentClientStatus || !previousClientStatusRef.current) {
      previousClientStatusRef.current = currentClientStatus ?? null;
      return;
    }

    // Check if status has changed
    if (previousClientStatusRef.current !== currentClientStatus) {
      onStatusChange(previousClientStatusRef.current, currentClientStatus);
    }

    // Update the previous status reference
    previousClientStatusRef.current = currentClientStatus;
  }, [currentClientStatus, onStatusChange]);

  return { currentClientStatus };
}
