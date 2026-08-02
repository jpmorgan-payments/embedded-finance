/**
 * Named Master Mode presets persisted in localStorage.
 * Each preset stores a full customization bundle as downloadable JSON shape.
 */

import {
  buildMasterModeExport,
  toSafeFileName,
  type MasterModeBundle,
} from '@/components/sellsense/master-mode-bundle';

const STORAGE_KEY = 'sellsense-master-mode-presets';

export type MasterModePreset = {
  id: string;
  name: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  bundle: MasterModeBundle;
};

type PresetStore = {
  presets: MasterModePreset[];
};

function safeParse(raw: string): PresetStore {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { presets: [] };
    }
    const presets = Array.isArray((parsed as PresetStore).presets)
      ? (parsed as PresetStore).presets.filter(
          (p) =>
            p &&
            typeof p === 'object' &&
            typeof p.id === 'string' &&
            typeof p.name === 'string'
        )
      : [];
    return { presets };
  } catch {
    return { presets: [] };
  }
}

function readStore(): PresetStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { presets: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? safeParse(raw) : { presets: [] };
}

function writeStore(store: PresetStore): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (store.presets.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listMasterModePresets(): MasterModePreset[] {
  return [...readStore().presets].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getMasterModePreset(id: string): MasterModePreset | undefined {
  return readStore().presets.find((p) => p.id === id);
}

export function saveMasterModePreset(input: {
  id?: string;
  name: string;
  fileName?: string;
  bundle: Omit<MasterModeBundle, 'kind' | 'version'> & {
    name?: string;
    fileName?: string;
  };
}): MasterModePreset {
  const name = input.name.trim() || 'Untitled';
  const fileName = (input.fileName?.trim() || toSafeFileName(name))
    .replace(/\.json$/i, '')
    .concat('.json');
  const now = new Date().toISOString();
  const store = readStore();
  const existingIndex = input.id
    ? store.presets.findIndex((p) => p.id === input.id)
    : -1;

  const bundle = buildMasterModeExport({
    ...input.bundle,
    name,
    fileName,
  });

  if (existingIndex >= 0) {
    const existing = store.presets[existingIndex];
    const updated: MasterModePreset = {
      ...existing,
      name,
      fileName,
      updatedAt: now,
      bundle,
    };
    store.presets[existingIndex] = updated;
    writeStore(store);
    return updated;
  }

  const created: MasterModePreset = {
    id: input.id || createId(),
    name,
    fileName,
    createdAt: now,
    updatedAt: now,
    bundle,
  };
  store.presets.unshift(created);
  writeStore(store);
  return created;
}

export function deleteMasterModePreset(id: string): void {
  const store = readStore();
  store.presets = store.presets.filter((p) => p.id !== id);
  writeStore(store);
}

export function downloadMasterModePreset(preset: MasterModePreset): void {
  const payload = buildMasterModeExport({
    ...preset.bundle,
    name: preset.name,
    fileName: preset.fileName,
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = preset.fileName || toSafeFileName(preset.name);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMasterModeBundle(
  bundle: MasterModeBundle,
  fileName: string
): void {
  const payload = buildMasterModeExport({
    ...bundle,
    fileName,
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
