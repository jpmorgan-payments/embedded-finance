import { createElement, type ComponentProps, type ComponentType } from 'react';
import ReactDOMClient from 'react-dom/client';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';

import { componentRegistry, ComponentRegistry } from './componentRegistry';

class EBComponentsManager {
  private config: EBConfig;
  private components: ComponentRegistry;
  private roots: Map<string, ReactDOMClient.Root>;

  constructor(config: EBConfig) {
    this.config = config;
    this.components = componentRegistry;
    this.roots = new Map();
  }

  public mountComponent<K extends keyof ComponentRegistry>(
    componentName: K,
    props: ComponentProps<ComponentRegistry[K]>,
    containerId: string
  ): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    const Component = this.components[componentName];
    if (Component) {
      const root = ReactDOMClient.createRoot(container);
      root.render(
        <EBComponentsProvider {...this.config}>
          {createElement(Component as ComponentType, props as never)}
        </EBComponentsProvider>
      );
      this.roots.set(containerId, root);
    } else {
      console.error(`Component ${componentName} not found`);
    }
  }

  public unmountComponent(containerId: string): void {
    const root = this.roots.get(containerId);
    if (root) {
      root.unmount();
      this.roots.delete(containerId);
    } else {
      console.error(`No mounted component found in #${containerId}`);
    }
  }
}

export const initEBComponentsManager = (config: EBConfig) =>
  new EBComponentsManager(config);
