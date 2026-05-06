import { SAMPLE_TERMS_EMBEDDED_PDF_BASE64 } from './sample-terms-pdf-base64.generated.ts';

/**
 * Inlined PDF bytes from `sample-terms-pdf-base64.generated.ts`.
 * Run `yarn embed:sample-pdf [<path/to.pdf>]` after changing terms content.
 * The repo ships no `.pdf` binaries; MSW uses only the generated module.
 */
export function getEmbeddedSampleTermsPdfBytes(): Uint8Array {
  const g = globalThis as typeof globalThis & {
    Buffer?: { from(input: string, encoding: string): Uint8Array };
  };
  if (typeof g.Buffer !== 'undefined') {
    return new Uint8Array(
      g.Buffer.from(SAMPLE_TERMS_EMBEDDED_PDF_BASE64, 'base64'),
    );
  }

  const binary = atob(SAMPLE_TERMS_EMBEDDED_PDF_BASE64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}
