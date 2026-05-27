/**
 * Generates `src/msw/sample-terms-pdf-base64.generated.ts` from a source PDF file.
 *
 * Usage:
 *   yarn embed:sample-pdf [<path/to.pdf>]
 *
 * Without arguments, reads `src/msw/sample-terms.pdf` when that file exists. If neither a
 * CLI path nor the default exists, exits 0 and leaves the committed generated module untouched
 * (Amplify/clones may ship without binaries).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(
  __dirname,
  '..',
  'src',
  'msw',
  'sample-terms-pdf-base64.generated.ts',
);

const defaultPdfPath = join(__dirname, '..', 'src', 'msw', 'sample-terms.pdf');
const inputArg = process.argv[2];
const pdfPath = inputArg
  ? resolve(process.cwd(), inputArg)
  : defaultPdfPath;

if (!existsSync(pdfPath)) {
  process.stderr.write(
    `embed-sample-terms-pdf: no source PDF at ${pdfPath}; keeping existing ${outPath}\n`,
  );
  process.exit(0);
}

const pdf = readFileSync(pdfPath);
const base64 = pdf.toString('base64');

const LINE = 96;
/** @type {string[]} */
const chunks = [];
for (let i = 0; i < base64.length; i += LINE) {
  chunks.push(base64.slice(i, i + LINE));
}

const header = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Regenerate: yarn embed:sample-pdf [<path/to.pdf>]
 */

/* eslint-disable max-len */
/* prettier-ignore */

`;

const body = `export const SAMPLE_TERMS_EMBEDDED_PDF_BASE64 = [\n${chunks
  .map((c) => `  '${c}'`)
  .join(',\n')},
].join('');
`;

writeFileSync(outPath, header + body, 'utf8');
process.stderr.write(
  `embedded-sample-pdf ${pdfPath} (${pdf.length} bytes) -> ${outPath}\n`,
);
