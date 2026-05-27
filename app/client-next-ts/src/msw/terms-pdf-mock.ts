/** In-memory PDF bytes served by GET .../documents/:id/file (set before MSW starts in the browser). */
let mockTermsPdfBytes: Uint8Array | undefined;

export function setTermsPdfMockBytes(bytes: Uint8Array | undefined): void {
  mockTermsPdfBytes = bytes;
}

export function getTermsPdfMockBytes(): Uint8Array | undefined {
  return mockTermsPdfBytes;
}
