import type { ReactNode } from 'react';

export function ProfileReadonlyValue({ value }: { value: ReactNode }) {
  return <p className="eb-font-bold">{value || 'N/A'}</p>;
}
