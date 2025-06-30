import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Dropzone from './dropzone';

const meta: Meta<typeof Dropzone> = {
  title: 'UI/Dropzone',
  component: Dropzone,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    enableCameraCapture: {
      control: { type: 'boolean' },
      description: 'Enable camera capture for mobile devices',
    },
    captureMode: {
      control: { type: 'select' },
      options: ['user', 'environment'],
      description:
        'Camera facing mode: user for front camera, environment for back camera',
    },
    fileMaxSize: {
      control: { type: 'number' },
      description: 'Maximum file size in bytes',
    },
    showCompressionInfo: {
      control: { type: 'boolean' },
      description: 'Show compression information for images',
    },
    showFilesList: {
      control: 'boolean',
      defaultValue: true,
    },
    showErrorMessage: {
      control: 'boolean',
      defaultValue: true,
    },
    enableFilePreview: {
      control: 'boolean',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropzone>;

// Helper component for controlled stories
const DropzoneWithState = (args: any) => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="eb-component eb-mx-auto eb-max-w-md eb-p-4">
      <Dropzone
        {...args}
        onChange={(newFiles) => {
          setFiles(newFiles);
          console.log('Files changed:', newFiles);
        }}
      />
      {files.length > 0 && (
        <div className="eb-mt-4">
          <h3 className="eb-mb-2 eb-text-sm eb-font-medium">Selected files:</h3>
          <ul className="eb-space-y-1 eb-text-xs">
            {files.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    showFilesList: true,
    showErrorMessage: true,
    showCompressionInfo: true,
  },
};

export const WithCameraCapture: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    ...Default.args,
    enableCameraCapture: true,
    captureMode: 'environment',
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropzone with camera capture enabled. On mobile devices, users can take photos directly using the camera. The `captureMode` can be set to "user" for front camera or "environment" for back camera.',
      },
    },
  },
};

export const FrontCameraCapture: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    ...Default.args,
    enableCameraCapture: true,
    captureMode: 'user',
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropzone configured for front camera capture (selfie mode). Ideal for profile pictures or document verification where the user needs to see themselves.',
      },
    },
  },
};

export const DocumentCapture: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    ...Default.args,
    enableCameraCapture: true,
    captureMode: 'environment',
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    fileMaxSize: 10 * 1024 * 1024, // 10MB
    compressionMaxDimension: 1500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropzone optimized for document capture using the back camera. Supports both images and PDFs with higher file size limits and larger compression dimensions.',
      },
    },
  },
};

export const WithCompression: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    ...Default.args,
    enableCameraCapture: true,
    captureMode: 'environment',
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    compressionFunc: async (file: File, maxDimension = 1000) => {
      // Simple mock compression function for demo
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const { width, height } = img;
          const ratio = Math.min(maxDimension / width, maxDimension / height);

          canvas.width = width * ratio;
          canvas.height = height * ratio;

          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(file.type, 0.8));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    showCompressionInfo: true,
    compressionMaxDimension: 800,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropzone with image compression enabled. Images are automatically compressed to reduce file size while maintaining quality. The compression process is shown with visual feedback.',
      },
    },
  },
};

export const SingleFileOnly: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    ...Default.args,
    enableCameraCapture: true,
    captureMode: 'user',
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropzone configured for single file upload only with camera capture. Once a file is selected, the dropzone is hidden.',
      },
    },
  },
};

export const WithFilePreview: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    showFilesList: true,
    showErrorMessage: true,
    multiple: true,
    fileMaxSize: 5 * 1024 * 1024, // 5MB
    enableFilePreview: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Upload images or PDFs and click on them to view in a preview modal',
      },
    },
  },
};

export const WithoutFilePreview: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    showFilesList: true,
    showErrorMessage: true,
    multiple: true,
    fileMaxSize: 5 * 1024 * 1024, // 5MB
    enableFilePreview: false,
  },
};

export const WithInitialFiles: Story = {
  render: (args) => <DropzoneWithState {...args} />,
  args: {
    showFilesList: true,
    showErrorMessage: true,
    multiple: true,
    value: Array.from({ length: 3 }).map(
      (_, i) =>
        new File(['dummy content'], `sample-file-${i + 1}.pdf`, {
          type: 'application/pdf',
        })
    ),
    enableFilePreview: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropzone initialized with existing files that can be previewed by clicking them',
      },
    },
  },
};
