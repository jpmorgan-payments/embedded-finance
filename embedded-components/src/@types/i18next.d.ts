import { defaultResources } from '@/i18n/config';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof defaultResources)['en'];
  }
}
