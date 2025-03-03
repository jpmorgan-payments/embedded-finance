import i18next from 'i18next';
import { toast } from 'sonner';

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
      toast.success(
        i18next.t('clientOnboardingStatus.notification.toast.title')
      );
      return 'granted' as NotificationStatus;
    }

    const permission = await Notification.requestPermission();
    return permission as NotificationStatus;
  },

  showNotification(title: string, options = {}) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Only show notification if tab is not visible
    if (document.visibilityState !== 'visible') {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  },
};
