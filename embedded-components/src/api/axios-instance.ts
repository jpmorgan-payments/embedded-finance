import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Shared Axios instance — kept as a singleton so interceptors are never lost.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g.__EB_AXIOS_INSTANCE__) {
  g.__EB_AXIOS_INSTANCE__ = Axios.create();
}
export const AXIOS_INSTANCE = g.__EB_AXIOS_INSTANCE__ as ReturnType<
  typeof Axios.create
>;

export const ebInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => {
    return data;
  });

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;

export type BodyType<BodyData> = BodyData;
