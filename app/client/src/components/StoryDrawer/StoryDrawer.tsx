import { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  ActionIcon,
  Box,
  Drawer,
  Group,
  Text,
  Button,
  Stepper,
  Paper,
  Stack,
  Title,
  ScrollArea,
  useMantineTheme,
  List,
  Mark,
  Badge,
} from '@mantine/core';
import {
  IconBook,
  IconListCheck,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons';
import { Prism } from '@mantine/prism';
import { useLocation } from 'react-router-dom';

// Define the structure for a story item
interface StoryItem {
  id: string;
  title: string;
  content: string;
  cssSelector: string;
  codeExample?: string;
}

// Sample stories data
const MOCK_STORIES: StoryItem[] = [
  {
    id: '1',
    title: 'Organization Description Validation',
    content:
      '# Organization Description\n\nThe organization description field uses extensive client-side validation as a superset of OAS validations. Our validation approach:\n\n- **DOMPurify sanitization** ensures data integrity by stripping all HTML tags and preventing XSS attacks\n- **Length constraints** (10-500 characters) provide reasonable limits while allowing sufficient detail\n- **URL injection prevention** removes any web links that could be used for phishing\n- **Whitespace normalization** creates consistent formatting by replacing multiple spaces with singles\n- **Character filtering** removes potentially problematic characters like `<` and `>`\n\nThis multi-stage approach first uses DOMPurify to handle any HTML/XSS risks, then applies custom cleaning with regex patterns to handle specific formatting concerns. The `transform` function in the schema means validation happens transparently to users, with feedback provided immediately during typing rather than only on submission.\n\nOur implementation significantly reduces API errors and enhances the user experience by catching formatting issues early in the submission process.',
    cssSelector: 'form [name="organizationDescription"]',
  },
  {
    id: '2',
    title: 'Industry Type Selector',
    content:
      '# Industry Type Selection\n\nOur `IndustryTypeSelect` component combines NAICS industry categories and specific types with a powerful text search interface to simplify a complex selection process.\n\n**Key UX improvements:**\n\n1. **Hierarchical organization** displays categories as section headers with child industries below, creating visual relationships between related options\n2. **Unified search** allows users to find industries by code, description, or sector name from a single input field\n3. **Virtualized rendering** with `react-window` ensures smooth performance even with 1000+ industry options\n4. **Visual distinction** between categories (bold/muted headers) and specific industries (regular text) reduces cognitive load\n5. **Smart filtering logic** keeps category headers visible when any child item matches, maintaining context\n\nThis approach significantly reduces selection time and error rates compared to traditional dropdown menus or separate category/subcategory selectors. The search functionality is particularly valuable for users who know their industry name but not the specific NAICS code.\n\nThe component adapts to viewport size, with column layout adjustments for mobile view, and includes keyboard navigation support for accessibility.',
    cssSelector: 'form [id*="industry"]',
  },
  {
    id: '3',
    title: 'Masked Input Fields',
    content:
      "# Masked Input Implementation\n\nFor sensitive numeric identifiers like EIN (Tax ID) and SSN, we've implemented smart masked inputs that enhance both security and usability.\n\n**Key features:**\n\n- **Dynamic formatting** automatically applies the correct pattern as users type (e.g., `XX-XXXXXXX` for EIN or `XXX-XX-XXXX` for SSN)\n- **Visual guides** show expected format with placeholder characters, reducing confusion about required length/format\n- **ID-specific validation** applies different rules based on selected ID type:\n  - EIN: 9 digits with specific formatting rules\n  - SSN: 9 digits in XXX-XX-XXXX pattern with value ranges\n  - ITIN: Similar to SSN but with special first-digit rules\n- **Masked characters** replace digits with configurable mask characters (default: '_') for privacy in shared environments\n- **Accessibility support** with proper ARIA labels and keyboard navigation\n\nThe implementation is tightly coupled with validation schemas that enforce business rules beyond just formatting, like checking that SSNs don't contain all zeros in any group.\n\nThis field adapts dynamically when users change the ID type, updating labels, validation rules, and formatting patterns automatically while clearing previous values to prevent format mismatch errors.",
    cssSelector: 'form [id*="value"]',
    codeExample: `// Dynamic mask and validation by ID type
<OnboardingFormField
  name={\`ids.\${index}.value\`}
  type="text"
  label={getValueLabel(field.idType)}
  maskFormat={getMaskFormat(field.idType)}
  maskChar="_"
/>`,
  },
  {
    id: '4',
    title: 'Birth Date Component',
    content:
      '# Birth Date Selection\n\nOur `ImportantDateSelector` component reimagines date entry with a carefully designed interface that addresses the limitations of traditional date inputs.\n\n**Design rationale:**\n\n- **Split field approach** divides the complex date entry into three distinct inputs (day, month, year), reducing cognitive load\n- **Dropdown for months** eliminates spelling errors and invalid month selections while providing full month names for clarity\n- **Progressive validation** includes multiple validation layers:\n  - *Basic format validation* ensures values are numeric and within range\n  - *Date existence validation* catches invalid dates like February 30th\n  - *Age restriction validation* applies business rules (e.g., must be 18+, cannot be 120+ years old)\n  - *Future date prevention* ensures birth dates cannot be in the future\n\n**Implementation details:**\n- Supports multiple date formats (DMY, MDY, YMD) for international usage\n- Provides configurable separators between fields\n- Uses custom hooks for validation to maintain clean component code\n- Implements controlled component pattern for form integration\n- Tracks field "touched" state to avoid premature error messages\n\nThis approach substantially reduces date entry errors compared to single-field date inputs, with particular improvements for users in countries with different date formats.',
    cssSelector: 'form [id*="birth-"]',
    codeExample: `// From ImportantDateSelector.tsx
<div className="date-selector">
  <MonthSelect 
    value={month} 
    onChange={handleMonthChange} 
  />
  <DayInput 
    value={day} 
    onChange={handleDayChange} 
  />
  <YearInput 
    value={year} 
    onChange={handleYearChange} 
  />
</div>`,
  },
];

// Create a context for drawer state
interface StoryDrawerContextType {
  drawerOpened: boolean;
  setDrawerOpened: (opened: boolean) => void;
}

const StoryDrawerContext = createContext<StoryDrawerContextType | undefined>(
  undefined,
);

// Hook to access drawer state
export const useStoryDrawer = () => {
  const context = useContext(StoryDrawerContext);
  if (!context) {
    return { drawerOpened: false, setDrawerOpened: () => {} };
  }
  return context;
};

// Provider component
export const StoryDrawerProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [drawerOpened, setDrawerOpened] = useState(false);

  return (
    <StoryDrawerContext.Provider value={{ drawerOpened, setDrawerOpened }}>
      {children}
    </StoryDrawerContext.Provider>
  );
};

export interface StoryDrawerProps {
  // Props can be extended as needed
}

// Helper function to parse simple markdown
const parseMarkdown = (content: string) => {
  // Process headers
  let parsedContent = content.replace(/^#+\s+(.*)$/gm, (_, header) => {
    return `<h3>${header}</h3>`;
  });

  // Process bold
  parsedContent = parsedContent.replace(
    /\*\*(.*?)\*\*/g,
    '<strong>$1</strong>',
  );

  // Process italic
  parsedContent = parsedContent.replace(/_(.*?)_/g, '<em>$1</em>');

  // Process unordered lists
  parsedContent = parsedContent.replace(/^-\s+(.*)$/gm, '<li>$1</li>');
  parsedContent = parsedContent.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Process ordered lists
  parsedContent = parsedContent.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  parsedContent = parsedContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (!match.startsWith('<ul>')) {
      return `<ol>${match}</ol>`;
    }
    return match;
  });

  // Process paragraphs
  parsedContent = parsedContent.replace(/^([^<].*[^>])$/gm, '<p>$1</p>');

  return parsedContent;
};

// Helper function for smooth scrolling to element
const scrollToElement = (element: HTMLElement, offset = 100) => {
  const rect = element.getBoundingClientRect();

  // Find the scrollable container (AppShell main)
  const mainContent = document.querySelector('.mantine-AppShell-main');

  if (mainContent) {
    // Calculate the scroll position to center the element in the viewport
    const mainRect = mainContent.getBoundingClientRect();
    const mainScrollTop = mainContent.scrollTop;

    // Center the element vertically in the viewport
    const elementTop = rect.top + window.scrollY;
    const elementMiddle = elementTop + rect.height / 2;
    const viewportMiddle = mainRect.top + mainRect.height / 2 + window.scrollY;
    const scrollTo = mainScrollTop + (elementMiddle - viewportMiddle);

    // Scroll the AppShell main content
    mainContent.scrollTo({
      top: scrollTo - offset, // Apply offset to adjust final position
      behavior: 'smooth',
    });
  } else {
    // Fallback to window scroll with simpler center calculation
    const elementTop = rect.top + window.scrollY;
    const elementCenter = elementTop - window.innerHeight / 2 + rect.height / 2;

    window.scrollTo({
      top: elementCenter - offset,
      behavior: 'smooth',
    });
  }
};

// Helper function to find the target element using selector
const findTargetElement = (selector: string): HTMLElement | null => {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      return elements[0] as HTMLElement;
    }
  } catch (error) {
    console.error('Error finding element with selector:', selector, error);
  }
  return null;
};

export const StoryDrawer = ({}: StoryDrawerProps) => {
  const theme = useMantineTheme();
  const { drawerOpened, setDrawerOpened } = useStoryDrawer();
  const [activeStep, setActiveStep] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const borderOverlayRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // Function to add/remove border around elements
  useEffect(() => {
    if (!drawerOpened || viewMode === 'list') return;

    const currentStory = MOCK_STORIES[activeStep];

    // Try to find elements with the selector
    let elements: NodeListOf<Element>;
    try {
      elements = document.querySelectorAll(currentStory.cssSelector);
    } catch (error) {
      console.error('Invalid selector:', currentStory.cssSelector);
      // Fallback to a guaranteed selector if there's an error
      elements = document.querySelectorAll('body');
    }

    // Remove existing overlay
    if (borderOverlayRef.current) {
      document.body.removeChild(borderOverlayRef.current);
      borderOverlayRef.current = null;
    }

    // If no elements found with the selector, fallback to body
    if (elements.length === 0) {
      console.warn(
        'No elements found with selector:',
        currentStory.cssSelector,
      );
      elements = document.querySelectorAll('body');
    }

    if (elements.length > 0) {
      const element = elements[0] as HTMLElement;
      const rect = element.getBoundingClientRect();
      const drawerWidth =
        document.querySelector('.mantine-Drawer-drawer')?.clientWidth || 0;

      // Adjust left position if drawer is open and content has shifted
      const leftOffset = drawerOpened ? -drawerWidth / 3 : 0;

      // Create overlay for the border
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX + leftOffset}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.border = '2px solid orange';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.boxSizing = 'border-box';
      overlay.style.boxShadow = '0 0 0 4px rgba(255, 165, 0, 0.3)';
      overlay.style.transition = 'all 0.3s ease-in-out';
      overlay.style.opacity = '0'; // Start invisible

      document.body.appendChild(overlay);
      borderOverlayRef.current = overlay;

      // Delay the appearance of the overlay to allow layout shift to complete
      setTimeout(() => {
        if (overlay && document.body.contains(overlay)) {
          // Scroll to the element with animation first
          scrollToElement(element, 80); // Smaller offset for better centering

          // Short delay before showing the highlight, so scrolling is complete
          setTimeout(() => {
            if (overlay && document.body.contains(overlay)) {
              // Update position again after drawer animation and scrolling completes
              const updatedRect = element.getBoundingClientRect();
              overlay.style.top = `${updatedRect.top + window.scrollY}px`;
              overlay.style.left = `${updatedRect.left + window.scrollX + leftOffset}px`;
              overlay.style.width = `${updatedRect.width}px`;
              overlay.style.height = `${updatedRect.height}px`;

              // Create a flash/zoom effect on the target element
              const originalTransition = element.style.transition || '';
              const originalZIndex = element.style.zIndex || '';
              const originalTransform = element.style.transform || '';
              const originalBoxShadow = element.style.boxShadow || '';

              // Apply highlight effect to the actual element
              element.style.transition = 'all 0.3s ease-out';
              element.style.zIndex = '9000';
              element.style.transform = 'scale(1.03)';
              element.style.boxShadow = '0 0 20px rgba(255, 165, 0, 0.5)';

              // Revert the element style after a brief flash
              setTimeout(() => {
                element.style.transform = originalTransform;
                element.style.boxShadow = originalBoxShadow;

                // After element animation completes, show the border overlay
                setTimeout(() => {
                  if (overlay && document.body.contains(overlay)) {
                    // Fade in the border
                    overlay.style.opacity = '1';

                    // Add pulse animation after fade-in
                    setTimeout(() => {
                      if (overlay && document.body.contains(overlay)) {
                        overlay.style.boxShadow =
                          '0 0 0 8px rgba(255, 165, 0, 0)';
                      }
                    }, 300);
                  }

                  // Restore original element styles
                  element.style.transition = originalTransition;
                  element.style.zIndex = originalZIndex;
                }, 300);
              }, 300);
            }
          }, 400);
        }
      }, 400); // Wait for drawer animation to complete
    }

    return () => {
      if (borderOverlayRef.current) {
        document.body.removeChild(borderOverlayRef.current);
        borderOverlayRef.current = null;
      }
    };
  }, [drawerOpened, activeStep, viewMode]);

  // Cleanup overlay when drawer closes
  useEffect(() => {
    if (!drawerOpened && borderOverlayRef.current) {
      document.body.removeChild(borderOverlayRef.current);
      borderOverlayRef.current = null;
    }
  }, [drawerOpened]);

  // Update overlay position on resize or scroll
  useEffect(() => {
    if (!drawerOpened || viewMode === 'list' || !borderOverlayRef.current)
      return;

    const handleUpdate = () => {
      if (!borderOverlayRef.current) return;

      const currentStory = MOCK_STORIES[activeStep];

      // Try to find elements with the selector
      let elements: NodeListOf<Element>;
      try {
        elements = document.querySelectorAll(currentStory.cssSelector);
      } catch (error) {
        console.error('Invalid selector for update:', currentStory.cssSelector);
        // Fallback to a guaranteed selector if there's an error
        elements = document.querySelectorAll('body');
      }

      // If no elements found with the selector, fallback to body
      if (elements.length === 0) {
        console.warn(
          'No elements found for update with selector:',
          currentStory.cssSelector,
        );
        elements = document.querySelectorAll('body');
      }

      if (elements.length > 0) {
        const element = elements[0] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const drawerWidth =
          document.querySelector('.mantine-Drawer-drawer')?.clientWidth || 0;

        // Adjust left position if drawer is open and content has shifted
        const leftOffset = drawerOpened ? -drawerWidth / 3 : 0;

        // Use clientX/Y coordinates to handle scrolling correctly
        borderOverlayRef.current.style.top = `${rect.top + window.scrollY}px`;
        borderOverlayRef.current.style.left = `${rect.left + window.scrollX + leftOffset}px`;
        borderOverlayRef.current.style.width = `${rect.width}px`;
        borderOverlayRef.current.style.height = `${rect.height}px`;
      }
    };

    // Initial update
    handleUpdate();

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    // Listen for scroll events on the AppShell main element too
    const mainContent = document.querySelector('.mantine-AppShell-main');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleUpdate);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [drawerOpened, activeStep, viewMode]);

  const handleNext = () => {
    if (activeStep < MOCK_STORIES.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
    setViewMode('details');
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'details' : 'list');
  };

  const currentStory = MOCK_STORIES[activeStep];

  return (
    <>
      <ActionIcon
        size={30}
        variant="default"
        onClick={() => {
          setDrawerOpened(true);
          // Start with list view when opening
          setViewMode('list');
        }}
        title="Interactive Stories"
      >
        <IconBook size={16} />
      </ActionIcon>

      <Drawer
        opened={drawerOpened}
        onClose={() => {
          setDrawerOpened(false);
        }}
        position="right"
        size="30%"
        padding="xs"
        withCloseButton
        withOverlay={false}
        lockScroll={false}
        classNames={{
          title: 'mantine-drawer-title',
        }}
        styles={(theme) => ({
          drawer: {
            transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'fixed',
            zIndex: 1000,
            boxShadow: '-5px 0 20px rgba(0, 0, 0, 0.1)',
            height: '100vh',
            overflowY: 'auto',
          },
          body: {
            padding: theme.spacing.md,
          },
          header: {
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
          },
          root: {
            position: 'fixed',
            zIndex: 999,
            '& .mantine-ScrollArea-root': {
              height: 'calc(100vh - 120px)',
            },
          },
          inner: {
            transform: 'none !important',
          },
          title: {
            marginRight: 0,
          },
          content: {
            maxWidth: '100%',
          },
        })}
        title={
          <Group position="apart" style={{ width: '100%' }}>
            <Text>Interactive Stories</Text>
            <ActionIcon
              variant="subtle"
              onClick={toggleViewMode}
              title={
                viewMode === 'list' ? 'View current story' : 'View all stories'
              }
            >
              <IconListCheck size={18} />
            </ActionIcon>
          </Group>
        }
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ScrollArea style={{ flex: 1 }}>
            {viewMode === 'list' ? (
              <Stack spacing="xs">
                <Text size="sm" color="dimmed" mb="xs">
                  Click on a story to view details
                </Text>
                {MOCK_STORIES.map((story, index) => (
                  <Paper
                    key={story.id}
                    p="xs"
                    withBorder
                    sx={(theme) => ({
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.fn.rgba(
                          theme.colors[theme.primaryColor][0],
                          0.5,
                        ),
                      },
                    })}
                    onClick={() => handleStepClick(index)}
                  >
                    <Group position="apart" spacing="xs">
                      <Stack spacing={0}>
                        <Text weight={500} size="sm">
                          {story.title}
                        </Text>
                        <Text size="xs" color="dimmed">
                          Story {index + 1} of {MOCK_STORIES.length}
                        </Text>
                      </Stack>
                      {story.codeExample && (
                        <Text size="xs" color="blue">
                          Code
                        </Text>
                      )}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Stepper
                active={activeStep}
                onStepClick={handleStepClick}
                breakpoint="sm"
                orientation="vertical"
                styles={(theme) => ({
                  stepLabel: {
                    fontSize: theme.fontSizes.sm,
                    fontWeight: 500,
                  },
                  stepDescription: {
                    fontSize: theme.fontSizes.xs,
                    marginTop: 0,
                  },
                  step: {
                    padding: 4,
                  },
                  separator: {
                    marginLeft: theme.spacing.xs,
                  },
                  separatorActive: {
                    marginLeft: theme.spacing.xs,
                  },
                  content: {
                    paddingLeft: theme.spacing.lg,
                    paddingBottom: 0,
                  },
                  stepIcon: {
                    width: 28,
                    height: 28,
                    fontSize: theme.fontSizes.xs,
                  },
                  verticalSeparator: {
                    marginLeft: 13, // Half of icon size - half of separator width
                  },
                })}
              >
                {MOCK_STORIES.map((story, index) => (
                  <Stepper.Step
                    key={story.id}
                    label={
                      <Group spacing={4} noWrap>
                        {story.title}
                        {index === activeStep && (
                          <Badge
                            size="xs"
                            variant="filled"
                            color="orange"
                            sx={{ minWidth: 'auto', height: 16 }}
                          >
                            Active
                          </Badge>
                        )}
                      </Group>
                    }
                    description={null}
                    allowStepSelect={drawerOpened}
                  >
                    <Paper
                      p="sm"
                      mb="xs"
                      mt={8}
                      shadow="xs"
                      sx={{ border: 'none' }}
                    >
                      <Stack spacing="xs">
                        <Group position="apart" mb="sm">
                          <Title order={3} size="h5">
                            {story.title}
                          </Title>
                          <Group spacing="xs">
                            <Button
                              compact
                              size="sm"
                              variant="subtle"
                              onClick={handlePrevious}
                              disabled={activeStep === 0}
                              leftIcon={<IconArrowLeft size={14} />}
                            >
                              Back
                            </Button>
                            <Button
                              compact
                              size="sm"
                              variant="subtle"
                              onClick={handleNext}
                              disabled={activeStep === MOCK_STORIES.length - 1}
                              rightIcon={<IconArrowRight size={14} />}
                            >
                              Next
                            </Button>
                          </Group>
                        </Group>

                        <Box
                          dangerouslySetInnerHTML={{
                            __html: parseMarkdown(story.content),
                          }}
                          sx={{
                            h3: {
                              fontSize: theme.fontSizes.md,
                              marginBottom: theme.spacing.xs,
                              marginTop: theme.spacing.md,
                              fontWeight: 600,
                            },
                            p: {
                              fontSize: theme.fontSizes.sm,
                              marginBottom: theme.spacing.xs,
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                              width: '100%',
                              maxWidth: '100%',
                            },
                            'ul, ol': {
                              fontSize: theme.fontSizes.sm,
                              paddingLeft: theme.spacing.md,
                              maxWidth: '100%',
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                            },
                            li: {
                              fontSize: theme.fontSizes.sm,
                              marginBottom: Number(theme.spacing.xs) / 2,
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                            },
                            code: {
                              fontSize: theme.fontSizes.sm,
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                              maxWidth: '100%',
                              display: 'inline-block',
                              padding: '2px 4px',
                              background: theme.colors.gray[0],
                              borderRadius: '3px',
                            },
                            strong: {
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                            },
                            em: {
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                            },
                            a: {
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word',
                            },
                            maxWidth: '100%',
                            overflowX: 'hidden',
                          }}
                        />

                        {story.codeExample && (
                          <Prism
                            language="tsx"
                            withLineNumbers
                            styles={{
                              code: {
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                maxWidth: '100%',
                                fontSize: theme.fontSizes.sm,
                              },
                              line: {
                                maxWidth: '100%',
                              },
                              root: {
                                marginBottom: 0,
                                paddingBottom: theme.spacing.xs,
                              },
                              scrollArea: {
                                padding: theme.spacing.xs,
                                paddingBottom: 0,
                              },
                            }}
                          >
                            {story.codeExample}
                          </Prism>
                        )}

                        <Text
                          size="sm"
                          color="dimmed"
                          sx={{
                            wordBreak: 'break-word',
                            marginTop: theme.spacing.xs,
                          }}
                        >
                          <Mark color="orange">Highlighted selector:</Mark>{' '}
                          <code
                            style={{
                              wordBreak: 'break-word',
                              maxWidth: '100%',
                              display: 'inline-block',
                              fontSize: theme.fontSizes.sm,
                            }}
                          >
                            {story.cssSelector}
                          </code>
                        </Text>

                        {/* Bottom navigation buttons */}
                        <Group
                          position="apart"
                          mt="md"
                          pt="xs"
                          sx={{
                            borderTop: `1px solid ${theme.colors.gray[3]}`,
                          }}
                        >
                          <Button
                            size="sm"
                            variant="subtle"
                            onClick={handlePrevious}
                            disabled={activeStep === 0}
                            leftIcon={<IconArrowLeft size={16} />}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            variant="subtle"
                            onClick={handleNext}
                            disabled={activeStep === MOCK_STORIES.length - 1}
                            rightIcon={<IconArrowRight size={16} />}
                          >
                            Next
                          </Button>
                        </Group>
                      </Stack>
                    </Paper>
                  </Stepper.Step>
                ))}
              </Stepper>
            )}
          </ScrollArea>
        </Box>
      </Drawer>
    </>
  );
};
