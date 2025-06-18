import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import Dropzone from './dropzone';

// Mock the compression function
const mockCompressionFunc = vi.fn();

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const mockPdfFile = new File(['pdf content'], 'document.pdf', {
  type: 'application/pdf',
});
const mockLargeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
  type: 'image/jpeg',
}); // 3MB file

describe('Dropzone', () => {
  beforeEach(() => {
    mockCompressionFunc.mockClear();
  });

  test('renders dropzone with compression info note when compression is enabled', () => {
    render(
      <Dropzone
        compressionFunc={mockCompressionFunc}
        compressibleExtensions={['.jpg', '.png']}
        fileMaxSize={2 * 1024 * 1024} // 2MB
        compressionMaxDimension={1000}
        showCompressionInfo
      />
    );

    expect(
      screen.getByText(
        /JPG, PNG images will be automatically compressed to 1000px/
      )
    ).toBeInTheDocument();
  });

  test('shows file size limit when fileMaxSize is provided', () => {
    render(
      <Dropzone
        fileMaxSize={2 * 1024 * 1024} // 2MB
      />
    );

    expect(screen.getByText(/Max\. file size: 2\.00 MB/)).toBeInTheDocument();
  });

  test('compresses compressible files when compression function is provided', async () => {
    const mockOnChange = vi.fn();
    mockCompressionFunc.mockResolvedValue('data:image/jpeg;base64,compressed');

    // Mock fetch for the compression result conversion
    global.fetch = vi.fn().mockResolvedValue({
      blob: () =>
        Promise.resolve(new Blob(['compressed'], { type: 'image/jpeg' })),
    });

    render(
      <Dropzone
        onChange={mockOnChange}
        compressionFunc={mockCompressionFunc}
        compressibleExtensions={['.jpg', '.jpeg']}
        fileMaxSize={2 * 1024 * 1024}
        showCompressionInfo
      />
    );

    const input = screen
      .getByRole('presentation')
      .querySelector('input[type="file"]');
    if (input) {
      await userEvent.upload(input, mockFile);

      await waitFor(() => {
        expect(mockCompressionFunc).toHaveBeenCalledWith(mockFile, 1000);
      });
    }
  });

  test('validates file size for non-compressible files', async () => {
    const mockOnChange = vi.fn();

    render(
      <Dropzone
        onChange={mockOnChange}
        fileMaxSize={1 * 1024 * 1024} // 1MB limit
        showErrorMessage
      />
    );

    const input = screen
      .getByRole('presentation')
      .querySelector('input[type="file"]');
    if (input) {
      // Create a large PDF file that exceeds the limit
      const largePdfFile = new File(
        ['x'.repeat(2 * 1024 * 1024)],
        'large.pdf',
        { type: 'application/pdf' }
      );
      await userEvent.upload(input, largePdfFile);

      await waitFor(() => {
        expect(
          screen.getByText(/File size exceeds the maximum allowed size/)
        ).toBeInTheDocument();
      });
    }
  });

  test('validates compressed file size when compression is used', async () => {
    const mockOnChange = vi.fn();

    // Mock compression that doesn't reduce size enough
    mockCompressionFunc.mockResolvedValue(
      'data:image/jpeg;base64,stillTooLarge'
    );
    global.fetch = vi.fn().mockResolvedValue({
      blob: () =>
        Promise.resolve(
          new Blob(['x'.repeat(2 * 1024 * 1024)], { type: 'image/jpeg' })
        ), // Still 2MB after "compression"
    });

    render(
      <Dropzone
        onChange={mockOnChange}
        compressionFunc={mockCompressionFunc}
        compressibleExtensions={['.jpg', '.jpeg']}
        fileMaxSize={1 * 1024 * 1024} // 1MB limit
        showErrorMessage
      />
    );

    const input = screen
      .getByRole('presentation')
      .querySelector('input[type="file"]');
    if (input) {
      await userEvent.upload(input, mockFile);

      await waitFor(() => {
        expect(
          screen.getByText(/Even after compression, file size exceeds/)
        ).toBeInTheDocument();
      });
    }
  });

  test('shows compression info in file preview when compression is successful', async () => {
    const mockOnChange = vi.fn();

    // Mock successful compression with 50% reduction
    mockCompressionFunc.mockResolvedValue('data:image/jpeg;base64,compressed');
    global.fetch = vi.fn().mockResolvedValue({
      blob: () =>
        Promise.resolve(new Blob(['compressed'], { type: 'image/jpeg' })), // Much smaller
    });

    render(
      <Dropzone
        onChange={mockOnChange}
        compressionFunc={mockCompressionFunc}
        compressibleExtensions={['.jpg', '.jpeg']}
        fileMaxSize={2 * 1024 * 1024}
        showCompressionInfo
      />
    );

    const input = screen
      .getByRole('presentation')
      .querySelector('input[type="file"]');
    if (input) {
      await userEvent.upload(input, mockFile);

      await waitFor(() => {
        // Should show the compression info in the file preview
        expect(screen.getByText(/compressed -/)).toBeInTheDocument();
      });
    }
  });

  test('does not compress non-compressible files', async () => {
    const mockOnChange = vi.fn();

    render(
      <Dropzone
        onChange={mockOnChange}
        compressionFunc={mockCompressionFunc}
        compressibleExtensions={['.jpg', '.png']}
        fileMaxSize={5 * 1024 * 1024}
      />
    );

    const input = screen
      .getByRole('presentation')
      .querySelector('input[type="file"]');
    if (input) {
      await userEvent.upload(input, mockPdfFile);

      await waitFor(() => {
        expect(mockCompressionFunc).not.toHaveBeenCalled();
        expect(mockOnChange).toHaveBeenCalledWith([mockPdfFile]);
      });
    }
  });

  test('resets internal state when key changes', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <Dropzone
        key="test-1"
        onChange={mockOnChange}
        fileMaxSize={5 * 1024 * 1024}
      />
    );

    // First render with one key
    expect(screen.getByText(/Drag and drop a file/)).toBeInTheDocument();

    // Rerender with different key should reset internal state
    rerender(
      <Dropzone
        key="test-2"
        onChange={mockOnChange}
        fileMaxSize={5 * 1024 * 1024}
      />
    );

    expect(screen.getByText(/Drag and drop a file/)).toBeInTheDocument();
  });
});
