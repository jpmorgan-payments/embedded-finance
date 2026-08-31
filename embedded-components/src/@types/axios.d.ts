import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipClientIdBodyInjection?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipClientIdBodyInjection?: boolean;
  }
}
