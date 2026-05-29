import i18next from 'i18next';

import { toast } from '@/components/ui/use-toast';

export type NotificationStatus =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

export const NotificationService = {
  getStatus(): NotificationStatus {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationStatus;
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return 'unsupported' as NotificationStatus;
    }

    if (Notification.permission === 'granted') {
      toast({
        title: i18next.t('clientOnboardingStatus.notification.toast.title'),
        variant: 'default',
      });
      return 'granted' as NotificationStatus;
    }

    const permission = await Notification.requestPermission();
    return permission as NotificationStatus;
  },

  async showNotification(title: string, options?: NotificationOptions) {
    try {
      if (!window.isSecureContext) {
        throw new Error('Secure context required');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted');
      }

      if (document.visibilityState !== 'visible') {
        const notification = new Notification(title, options);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } else {
        toast({
          title,
          description: options?.body,
          duration: 5000,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch {
      // Fallback to toast notification
      toast({
        title,
        description: options?.body,
        duration: 5000,
      });
    }
  },
};
