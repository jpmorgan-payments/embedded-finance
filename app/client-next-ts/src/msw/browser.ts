import { setupWorker } from 'msw/browser';

import { API_URL } from '../data/constants';
import { createHandlers } from './handlers.ts';
import sampleTermsPdfUrl from './sample-terms.pdf?url';
import { decodeFallbackTermsPdfBytes } from './terms-pdf-fallback.ts';
import { setTermsPdfMockBytes } from './terms-pdf-mock.ts';

function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d // "%PDF-"
  );
}

/**
 * Load the bundled mock PDF once in the **document** realm *before* `worker.start()`.
 * The MSW Service Worker avoids nested `fetch` for this file — that pattern often breaks blobs on
 * static hosts. If the bundled asset responds with HTML (SPA rewrite), fall back to inline bytes.
 */
async function hydrateTermsPdfMockFromBundledAsset(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const url = sampleTermsPdfUrl.startsWith('http')
      ? sampleTermsPdfUrl
      : new URL(sampleTermsPdfUrl, window.location.href).href;
    const res = await fetch(url);
    if (!res.ok) {
      setTermsPdfMockBytes(undefined);
      return;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    setTermsPdfMockBytes(
      looksLikePdf(bytes) ? bytes : decodeFallbackTermsPdfBytes(),
    );
  } catch {
    setTermsPdfMockBytes(undefined);
  }
}

export async function startShowcaseMocks(): Promise<void> {
  await hydrateTermsPdfMockFromBundledAsset();
  const worker = setupWorker(...createHandlers(API_URL));
  await worker.start({ onUnhandledRequest: 'bypass' });
}
