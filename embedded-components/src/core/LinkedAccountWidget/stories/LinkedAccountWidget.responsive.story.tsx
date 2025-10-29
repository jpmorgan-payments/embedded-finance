import React from 'react';
import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { LinkedAccountWidget } from '../LinkedAccountWidget';

/**
 * This story demonstrates the responsive behavior of the LinkedAccountWidget
 * using container queries. The component adapts to its container width rather
 * than the viewport width, making it suitable for sidebars, modals, and
 * variable-width layouts.
 */

const meta: Meta<typeof LinkedAccountWidget> = {
  title: 'Core/LinkedAccountWidget/Responsive Layouts',
  component: LinkedAccountWidget,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The LinkedAccountWidget uses container queries to adapt to its container width. Resize the container or viewport to see how the component responds to different widths.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/v1/embedded-payments/recipients', () => {
          return HttpResponse.json(linkedAccountListMock);
        }),
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LinkedAccountWidget>;

/**
 * Narrow container (320px) - Mobile layout
 * - Stacked header with full-width button
 * - Single-column account cards
 */
export const NarrowContainer: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-min-h-screen eb-items-start eb-justify-center eb-bg-gray-50 eb-p-4">
        <div className="eb-w-80">
          <div className="eb-mb-4 eb-rounded-lg eb-bg-blue-50 eb-p-3">
            <p className="eb-text-sm eb-text-blue-800">
              <strong>Container width:</strong> 320px (Mobile)
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'In narrow containers (< 448px), the header stacks vertically and the button becomes full-width.',
      },
    },
  },
};

/**
 * Medium container (600px) - Tablet layout
 * - Horizontal header with auto-width button
 * - Single-column account cards
 */
export const MediumContainer: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-min-h-screen eb-items-start eb-justify-center eb-bg-gray-50 eb-p-4">
        <div className="eb-w-[600px]">
          <div className="eb-mb-4 eb-rounded-lg eb-bg-green-50 eb-p-3">
            <p className="eb-text-sm eb-text-green-800">
              <strong>Container width:</strong> 600px (Tablet)
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'In medium containers (448px - 896px), the header becomes horizontal but cards remain in a single column.',
      },
    },
  },
};

/**
 * Wide container (1000px) - Desktop layout
 * - Horizontal header
 * - Two-column account card grid
 */
export const WideContainer: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-min-h-screen eb-items-start eb-justify-center eb-bg-gray-50 eb-p-4">
        <div className="eb-w-[1000px]">
          <div className="eb-mb-4 eb-rounded-lg eb-bg-purple-50 eb-p-3">
            <p className="eb-text-sm eb-text-purple-800">
              <strong>Container width:</strong> 1000px (Desktop)
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'In wide containers (> 896px), account cards display in a two-column grid layout for better space utilization.',
      },
    },
  },
};

/**
 * Full width with centering
 * - Component centers itself with max-width
 * - Two-column grid for account cards
 */
export const FullWidthWithCentering: Story = {
  decorators: [
    (Story) => (
      <div className="eb-min-h-screen eb-bg-gray-50 eb-p-4">
        <div className="eb-mb-4 eb-rounded-lg eb-bg-indigo-50 eb-p-3 eb-text-center">
          <p className="eb-text-sm eb-text-indigo-800">
            <strong>Container width:</strong> Full width (component self-centers
            at 1024px max-width)
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When placed in a full-width container, the component self-centers with a max-width of 1024px to maintain optimal readability.',
      },
    },
  },
};

/**
 * Sidebar layout (280px)
 * - Very narrow container
 * - Compact vertical layout
 */
export const SidebarLayout: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-min-h-screen eb-bg-gray-50">
        <aside className="eb-w-[280px] eb-border-r eb-border-gray-200 eb-bg-white eb-p-4">
          <div className="eb-mb-4 eb-rounded-lg eb-bg-orange-50 eb-p-3">
            <p className="eb-text-xs eb-text-orange-800">
              <strong>Sidebar:</strong> 280px
            </p>
          </div>
          <Story />
        </aside>
        <main className="eb-flex-1 eb-p-8">
          <div className="eb-rounded-lg eb-bg-white eb-p-6 eb-shadow-sm">
            <h1 className="eb-mb-2 eb-text-2xl eb-font-bold">Main Content</h1>
            <p className="eb-text-gray-600">
              This demonstrates the LinkedAccountWidget in a sidebar layout. The
              component adapts to the narrow sidebar width while maintaining
              usability.
            </p>
          </div>
        </main>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Example of the widget in a sidebar. The component adapts to the narrow width while maintaining all functionality.',
      },
    },
  },
};

/**
 * Modal/Dialog layout
 * - Medium-width container (640px)
 * - Typical modal width
 */
export const ModalLayout: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-min-h-screen eb-items-center eb-justify-center eb-bg-gray-900/50 eb-p-4">
        <div className="eb-w-full eb-max-w-2xl eb-rounded-lg eb-bg-white eb-p-6 eb-shadow-xl">
          <div className="eb-mb-4 eb-rounded-lg eb-bg-teal-50 eb-p-3">
            <p className="eb-text-sm eb-text-teal-800">
              <strong>Modal width:</strong> 640px (max-w-2xl)
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Example of the widget in a modal or dialog. The component adapts to the modal width gracefully.',
      },
    },
  },
};

/**
 * Comparison view showing all breakpoints
 */
export const AllBreakpointsComparison: Story = {
  render: () => (
    <div className="eb-min-h-screen eb-space-y-8 eb-bg-gray-50 eb-p-8">
      <div>
        <h2 className="eb-mb-4 eb-text-2xl eb-font-bold">
          Responsive Breakpoints Comparison
        </h2>
        <p className="eb-mb-8 eb-text-gray-600">
          This story shows how the LinkedAccountWidget adapts to different
          container widths using container queries.
        </p>
      </div>

      {/* Narrow */}
      <div>
        <h3 className="eb-mb-2 eb-text-lg eb-font-semibold">
          Mobile (320px) - Below @md breakpoint
        </h3>
        <div className="eb-w-80">
          <LinkedAccountWidget />
        </div>
      </div>

      {/* Medium */}
      <div>
        <h3 className="eb-mb-2 eb-text-lg eb-font-semibold">
          Tablet (600px) - Above @md, below @2xl
        </h3>
        <div className="eb-w-[600px]">
          <LinkedAccountWidget />
        </div>
      </div>

      {/* Wide */}
      <div>
        <h3 className="eb-mb-2 eb-text-lg eb-font-semibold">
          Desktop (1000px) - Above @2xl breakpoint
        </h3>
        <div className="eb-w-[1000px]">
          <LinkedAccountWidget />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'A side-by-side comparison of all responsive breakpoints to see how the layout adapts.',
      },
    },
  },
};
