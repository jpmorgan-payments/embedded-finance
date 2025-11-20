import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook to fetch the user's public IP address
 *
 * This hook uses multiple fallback services to ensure reliability.
 * In test environments, it returns a mock IP address.
 *
 * @returns Query result containing the IP address string
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
        const { publicIpv4 } = await import('public-ip');

        return publicIpv4({
          fallbackUrls: [
            `https://ifconfig.co/ip`,
            'https://api64.ipify.org/',
            'https://ipapi.co/ip',
          ],
        });
      }
      return new Promise((resolve) => {
        resolve('1.1.1.1');
      });
    },
    retry: 5,
  });
};
