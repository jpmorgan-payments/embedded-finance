import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import Dropzone, { sanitizeBlobUrl, type DropzoneProps } from './dropzone';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a fake File with the given properties. */
const createFile = (name: string, size: number, type: string): File => {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
};

const imageFile = () => createFile('photo.png', 4096, 'image/png');
const pdfFile = () => createFile('doc.pdf', 8192, 'application/pdf');
const largeFile = () => createFile('big.png', 6 * 1024 * 1024, 'image/png'); // 6 MB

/** Simulate dropping files into the dropzone input. */
const dropFiles = async (input: HTMLElement, files: File[]) => {
  await act(async () => {
    await userEvent.upload(input, files);
  });
};

const renderDropzone = (props: Partial<DropzoneProps> = {}) => {
  const onChange = vi.fn();
  const result = render(<Dropzone onChange={onChange} {...props} />);
  return { ...result, onChange };
};

// ── Mocks ────────────────────────────────────────────────────────────────────

let blobCounter = 0;
const revokeObjectURL = vi.fn();

beforeEach(() => {
  blobCounter = 0;
  revokeObjectURL.mockClear();

  // URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => {
    blobCounter += 1;
    return `blob:http://localhost/${blobCounter}`;
  });
  global.URL.revokeObjectURL = revokeObjectURL;

  // window.open
  vi.stubGlobal('open', vi.fn());
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Dropzone', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the default drop area with upload text', () => {
      renderDropzone();

      expect(
        screen.getByText('Drag and drop a file or click to browse')
      ).toBeInTheDocument();
    });

    it('shows accepted file types when accept prop is provided', () => {
      renderDropzone({
        accept: { 'image/png': ['.png'], 'application/pdf': ['.pdf'] },
      });

      expect(screen.getByText(/Accepted file types/i)).toBeInTheDocument();
      expect(screen.getByText(/PNG, PDF/i)).toBeInTheDocument();
    });

    it('shows max file size when maxSize prop is provided', () => {
      renderDropzone({ maxSize: 5 * 1024 * 1024 });

      expect(screen.getByText(/Max. file size: 5.00 MB/)).toBeInTheDocument();
    });

    it('shows max file size when fileMaxSize prop is provided', () => {
      renderDropzone({ fileMaxSize: 2 * 1024 * 1024 });

      expect(screen.getByText(/Max. file size: 2.00 MB/)).toBeInTheDocument();
    });

    it('renders camera capture text when camera mode is enabled', () => {
      renderDropzone({ enableCameraCapture: true, captureMode: 'environment' });

      expect(
        screen.getByText('Take a photo or upload a file')
      ).toBeInTheDocument();
    });

    it('adds capture attribute to input when camera capture is enabled', () => {
      renderDropzone({ enableCameraCapture: true, captureMode: 'user' });

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('capture', 'user');
    });

    it('renders custom children when provided', () => {
      render(
        <Dropzone>
          {() => <span data-testid="custom-child">Custom content</span>}
        </Dropzone>
      );

      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });
  });

  // ─── File Upload ─────────────────────────────────────────────────────────

  describe('file upload', () => {
    it('calls onChange with uploaded file', async () => {
      const { onChange } = renderDropzone();

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = imageFile();
      await dropFiles(input, [file]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([file]);
      });
    });

    it('displays uploaded file in file list', async () => {
      renderDropzone();

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(screen.getByText('photo')).toBeInTheDocument();
        expect(screen.getByText(/\.png/)).toBeInTheDocument();
      });
    });

    it('appends files when multiple is true', async () => {
      const { onChange } = renderDropzone({ multiple: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file1 = imageFile();
      const file2 = pdfFile();

      await dropFiles(input, [file1]);
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([file1]);
      });

      await dropFiles(input, [file2]);
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([file1, file2]);
      });
    });

    it('replaces file when multiple is false', async () => {
      const { onChange } = renderDropzone({ multiple: false });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledTimes(1);
      });
    });

    it('hides dropzone area when multiple is false and a file is uploaded', async () => {
      renderDropzone({ multiple: false });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.queryByText('Drag and drop a file or click to browse')
        ).not.toBeInTheDocument();
      });
    });
  });

  // ─── File List Display ───────────────────────────────────────────────────

  describe('file list', () => {
    it('hides file list when showFilesList is false', async () => {
      renderDropzone({ showFilesList: false });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(screen.queryByText('photo')).not.toBeInTheDocument();
      });
    });

    it('shows PDF icon for PDF files', async () => {
      renderDropzone();

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [pdfFile()]);

      await waitFor(() => {
        expect(screen.getByText('doc')).toBeInTheDocument();
      });
    });

    it('shows file size in MB', async () => {
      renderDropzone();

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(screen.getByText(/0\.00 MB/)).toBeInTheDocument();
      });
    });
  });

  // ─── File Deletion ───────────────────────────────────────────────────────

  describe('file deletion', () => {
    it('removes file when delete button is clicked', async () => {
      const { onChange } = renderDropzone();

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(screen.getByText('photo')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: 'Delete file' });
      await userEvent.click(deleteBtn);

      expect(screen.queryByText('photo')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith([]);
    });
  });

  // ─── File Size Validation ────────────────────────────────────────────────

  describe('file size validation', () => {
    it('rejects files exceeding fileMaxSize', async () => {
      renderDropzone({ fileMaxSize: 1 * 1024 * 1024 });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [largeFile()]);

      await waitFor(() => {
        expect(
          screen.getByText(/File size exceeds the maximum allowed size/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ─── Compression ─────────────────────────────────────────────────────────

  describe('compression', () => {
    const mockCompressionFunc = vi.fn(async () => {
      // Return a small data URL to simulate compression
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    });

    it('calls compressionFunc for compressible files', async () => {
      renderDropzone({
        compressionFunc: mockCompressionFunc,
        compressibleExtensions: ['.png'],
        showCompressionInfo: true,
      });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(mockCompressionFunc).toHaveBeenCalledWith(
          expect.any(File),
          1000
        );
      });
    });

    it('does not compress non-compressible files', async () => {
      const localCompressionFunc = vi.fn(
        async () => 'data:image/png;base64,abc'
      );
      renderDropzone({
        compressionFunc: localCompressionFunc,
        compressibleExtensions: ['.png'],
      });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      // PDF is not in compressibleExtensions so it should not be compressed
      await dropFiles(input, [pdfFile()]);

      await waitFor(() => {
        expect(screen.getByText('doc')).toBeInTheDocument();
      });
      expect(localCompressionFunc).not.toHaveBeenCalled();
    });

    it('falls back to original file when compression fails', async () => {
      const failingCompression = vi.fn(async () => {
        throw new Error('Compression failed');
      });

      const { onChange } = renderDropzone({
        compressionFunc: failingCompression,
        compressibleExtensions: ['.png'],
      });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = imageFile();
      await dropFiles(input, [file]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([file]);
      });
    });

    it('shows error when compression fails and original exceeds max', async () => {
      const failingCompression = vi.fn(async () => {
        throw new Error('Compression failed');
      });

      renderDropzone({
        compressionFunc: failingCompression,
        compressibleExtensions: ['.png'],
        fileMaxSize: 1024, // 1 KB — the 4 KB imageFile will exceed this
      });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.getByText(/File size exceeds the maximum allowed size/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ─── Preview ─────────────────────────────────────────────────────────────

  describe('file preview', () => {
    it('shows preview button for image files when enableFilePreview is true', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });
    });

    it('shows preview button for PDF files', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [pdfFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });
    });

    it('hides preview button when enableFilePreview is false', async () => {
      renderDropzone({ enableFilePreview: false });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(screen.getByText('photo')).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('button', { name: 'Preview file' })
      ).not.toBeInTheDocument();
    });

    it('opens image preview dialog when preview button is clicked', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Preview file' })
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByAltText('photo.png')).toBeInTheDocument();
      });
    });

    it('opens PDF in new tab instead of dialog', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [pdfFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Preview file' })
      );

      expect(window.open).toHaveBeenCalledWith(
        expect.stringMatching(/^blob:/),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('renders Open in New Tab button in preview dialog', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Preview file' })
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Open in new tab' })
        ).toBeInTheDocument();
      });
    });

    it('opens image in new tab when Open in New Tab is clicked', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Preview file' })
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Open in new tab' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Open in new tab' })
      );

      expect(window.open).toHaveBeenCalledWith(
        expect.stringMatching(/^blob:/),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  // ─── URL Sanitization (XSS prevention) ──────────────────────────────────

  describe('sanitizeBlobUrl', () => {
    it('allows blob: URLs', () => {
      expect(sanitizeBlobUrl('blob:http://localhost/abc-123')).toBe(
        'blob:http://localhost/abc-123'
      );
    });

    it('rejects http: URLs', () => {
      expect(sanitizeBlobUrl('http://evil.com')).toBe('');
    });

    it('rejects https: URLs', () => {
      expect(sanitizeBlobUrl('https://evil.com')).toBe('');
    });

    it('rejects data: URLs', () => {
      expect(sanitizeBlobUrl('data:text/plain;base64,dGVzdA==')).toBe('');
    });

    it('returns empty string for null', () => {
      expect(sanitizeBlobUrl(null)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(sanitizeBlobUrl('')).toBe('');
    });

    it('rejects malformed URLs', () => {
      expect(sanitizeBlobUrl('not-a-url')).toBe('');
    });

    it('renders blob src for image in preview dialog', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Preview file' })
      );

      await waitFor(() => {
        const img = screen.getByAltText('photo.png');
        expect(img.getAttribute('src')).toMatch(/^blob:/);
      });
    });

    it('does not open new tab when URL is not blob:', async () => {
      // Override createObjectURL to return a non-blob URL
      global.URL.createObjectURL = vi.fn(
        () => 'data:text/plain;base64,dGVzdA=='
      );

      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [pdfFile()]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Preview file' })
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Preview file' })
      );

      // window.open should NOT have been called since the URL is not blob:
      expect(window.open).not.toHaveBeenCalledWith(
        'data:text/plain;base64,dGVzdA==',
        '_blank',
        expect.anything()
      );
    });
  });

  // ─── External Value Prop ─────────────────────────────────────────────────

  describe('value prop', () => {
    it('renders files from initial value prop', () => {
      const files = [imageFile(), pdfFile()];
      renderDropzone({ value: files });

      expect(screen.getByText('photo')).toBeInTheDocument();
      expect(screen.getByText('doc')).toBeInTheDocument();
    });

    it('syncs when value prop changes', () => {
      const file1 = imageFile();
      const file2 = pdfFile();

      const { rerender } = render(<Dropzone value={[file1]} />);

      expect(screen.getByText('photo')).toBeInTheDocument();

      rerender(<Dropzone value={[file1, file2]} />);

      expect(screen.getByText('photo')).toBeInTheDocument();
      expect(screen.getByText('doc')).toBeInTheDocument();
    });
  });

  // ─── Reset Key ───────────────────────────────────────────────────────────

  describe('resetKey', () => {
    it('clears files when resetKey changes', async () => {
      const onChange = vi.fn();
      const { rerender } = render(<Dropzone onChange={onChange} />);

      // Upload a file first
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(screen.getByText('photo')).toBeInTheDocument();
      });

      // Changing resetKey should clear the files
      rerender(<Dropzone onChange={onChange} resetKey={1} />);

      await waitFor(() => {
        expect(screen.queryByText('photo')).not.toBeInTheDocument();
      });
    });
  });

  // ─── Error Messages ─────────────────────────────────────────────────────

  describe('error messages', () => {
    it('hides error messages when showErrorMessage is false', async () => {
      renderDropzone({
        showErrorMessage: false,
        fileMaxSize: 1024,
      });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [largeFile()]);

      // Error message should not be visible
      await waitFor(() => {
        expect(
          screen.queryByText(/File size exceeds/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  // ─── Custom onDrop ──────────────────────────────────────────────────────

  describe('custom onDrop', () => {
    it('calls custom onDrop instead of default handler', async () => {
      const customOnDrop = vi.fn();
      const onChange = vi.fn();
      render(<Dropzone onDrop={customOnDrop} onChange={onChange} />);

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await dropFiles(input, [imageFile()]);

      await waitFor(() => {
        expect(customOnDrop).toHaveBeenCalled();
      });
      // Default onChange should NOT be called when custom onDrop is used
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // ─── Non-previewable Files ──────────────────────────────────────────────

  describe('non-previewable files', () => {
    it('does not show preview button for non-image/non-PDF files', async () => {
      renderDropzone({ enableFilePreview: true });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const textFile = createFile('readme.txt', 100, 'text/plain');
      await dropFiles(input, [textFile]);

      await waitFor(() => {
        expect(screen.getByText('readme')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: 'Preview file' })
      ).not.toBeInTheDocument();
    });
  });
});
