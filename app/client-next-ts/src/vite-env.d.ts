/// <reference types="vite/client" />

declare module '*.yaml?raw' {
  const content: string;
  export default content;
}

declare module '@visual-json/react' {
  import type { ComponentType } from 'react';
  export const JsonEditor: ComponentType<{
    value: unknown;
    onChange: (value: unknown) => void;
    height?: string;
    className?: string;
    style?: Record<string, string>;
  }>;
}
