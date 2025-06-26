import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Dropzone from './dropzone';

// Mock createObjectURL
URL.createObjectURL = vi.fn(() => 'mock-url');
URL.revokeObjectURL = vi.fn();

// Mock file for testing
const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', {
    get() {
      return size;
    },
  });
  return file;
};

describe('Dropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<Dropzone />);
    expect(
      screen.getByText(/drag and drop a file or click to browse/i)
    ).toBeInTheDocument();
  });

  test('shows files after upload', async () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    const mockFiles = [mockFile];

    // Mock the FileList object
    const fileList = {
      length: mockFiles.length,
      item: (index: number) => mockFiles[index],
      0: mockFiles[0],
    };

    render(<Dropzone />);

    // Get the input element
    const input = screen.getByRole('button').querySelector('input');
    expect(input).not.toBeNull();

    // Simulate file upload
    if (input) {
      fireEvent.change(input, { target: { files: fileList } });
    }

    // Check if the file is displayed
    await waitFor(() => {
      expect(screen.getByText(/test/i)).toBeInTheDocument();
    });
  });

  test('deletes uploaded file when delete button is clicked', async () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    const onChange = vi.fn();

    render(<Dropzone value={[mockFile]} onChange={onChange} />);

    // Verify file is displayed
    expect(screen.getByText(/test/i)).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByRole('presentation');
    fireEvent.click(deleteButton);

    // Check if onChange was called with empty array
    expect(onChange).toHaveBeenCalledWith([]);
  });

  test('shows camera capture text when enableCameraCapture is true', () => {
    render(<Dropzone enableCameraCapture captureMode="environment" />);
    expect(
      screen.getByText(/take a photo or upload a file/i)
    ).toBeInTheDocument();
  });

  test('shows max file size when fileMaxSize is provided', () => {
    const fileMaxSize = 5 * 1024 * 1024; // 5MB
    render(<Dropzone fileMaxSize={fileMaxSize} />);
    expect(screen.getByText(/max. file size: 5.00 mb/i)).toBeInTheDocument();
  });

  test('opens preview modal when clicking on an image file', async () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    const user = userEvent.setup();

    render(<Dropzone value={[mockFile]} enableFilePreview />);

    // Click on the file to open preview
    const fileItem = screen.getByText(/test/i).closest('div');
    expect(fileItem).not.toBeNull();

    if (fileItem) {
      await user.click(fileItem);
    }

    // Check if preview modal is shown
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(
        screen.getByRole('button', { name: /close preview/i })
      ).toBeInTheDocument();
    });
  });

  test('closes preview modal when clicking the close button', async () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    const user = userEvent.setup();

    render(<Dropzone value={[mockFile]} enableFilePreview />);

    // Click on the file to open preview
    const fileItem = screen.getByText(/test/i).closest('div');
    if (fileItem) {
      await user.click(fileItem);
    }

    // Check if preview modal is shown
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /close preview/i })
      ).toBeInTheDocument();
    });

    // Click close button
    await user.click(screen.getByRole('button', { name: /close preview/i }));

    // Check if modal is closed and URL is revoked
    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(
        screen.queryByRole('button', { name: /close preview/i })
      ).not.toBeInTheDocument();
    });
  });

  test('does not open preview for non-previewable files', async () => {
    const mockFile = createMockFile('test.txt', 'text/plain');
    const user = userEvent.setup();

    render(<Dropzone value={[mockFile]} enableFilePreview />);

    // Click on the file
    const fileItem = screen.getByText(/test/i).closest('div');
    if (fileItem) {
      await user.click(fileItem);
    }

    // Check that preview modal is not shown
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /close preview/i })
    ).not.toBeInTheDocument();
  });

  test('does not show preview functionality when enableFilePreview is false', async () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');

    render(<Dropzone value={[mockFile]} enableFilePreview={false} />);

    // Check that eye icon is not present
    expect(screen.queryByText('eye-icon')).not.toBeInTheDocument();
  });
});
