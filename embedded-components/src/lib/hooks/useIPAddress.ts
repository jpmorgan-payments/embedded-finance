import { useQuery } from '@tanstack/react-query';

// Fallback IP address when public IP detection fails (e.g., blocked by firewall)
const FALLBACK_IP_ADDRESS = '0.0.0.0';

/**
 * Custom hook to fetch the user's public IP address
 *
 * This hook uses multiple fallback services to ensure reliability.
 * In test environments, it returns a mock IP address.
 * If all services fail (e.g., blocked by corporate firewall), returns '0.0.0.0'.
 *
 * @returns Query result containing the IP address string (never undefined on success)
 *
 * @example
 * ```tsx
 * const { data: IPAddress, isLoading } = useIPAddress();
 *
 * if (isLoading) return <div>Loading IP...</div>;
 * return <div>Your IP: {IPAddress}</div>;
 * ```
 */
export const useIPAddress = () => {
  return useQuery<string>({
    queryKey: ['useIPAddress'],
    queryFn: async () => {
      if (process.env.NODE_ENV !== 'test') {
        try {
          const { publicIpv4 } = await import('public-ip');

          return await publicIpv4({
            fallbackUrls: [
              `https://ifconfig.co/ip`,
              'https://api64.ipify.org/',
              'https://ipapi.co/ip',
            ],
          });
        } catch {
          // If all IP services fail (e.g., blocked by firewall), return fallback
          console.warn(
            'Failed to fetch public IP address, using fallback:',
            FALLBACK_IP_ADDRESS
          );
          return FALLBACK_IP_ADDRESS;
        }
      }
      return '1.1.1.1';
    },
    retry: 3,
    // Ensure we always have a value even if the query fails
    placeholderData: FALLBACK_IP_ADDRESS,
  });
};
