import { FC, useState } from 'react';
import {
  Box,
  Group,
  Title,
  Text,
  Card,
  SimpleGrid,
  Paper,
  Stack,
  Button,
  Collapse,
  Code,
  Divider,
  Loader,
  Center,
  Accordion,
  Avatar,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
} from '@tabler/icons';
import { API_URL } from 'data/constants';
import { useMutation } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import onboardingIntegrationGuideText from '../docs/PARTIALLY_HOSTED_ONBOARDING_INTEGRATION_GUIDE.md?raw';
import styles from './SampleDashboard.module.css';

interface SessionTransferResponse {
  token: string;
  userId: string;
  expiresIn: number;
}

// Session transfer API call
const initiateSessionTransfer = async (userId: string) => {
  const res = await fetch(`${API_URL}/api/onboarding/session-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Session transfer failed with status: ${res.status}`,
    );
  }

  return res.json();
};

export const SampleDashboard: FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string>('Overview');
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // Simulate userId for session transfer
  const userId = 'sample-user-001';

  // Use react-query mutation for session transfer
  const {
    mutate: startSessionTransfer,
    isLoading,
    error: mutationError,
  } = useMutation<SessionTransferResponse, Error>({
    mutationFn: () => initiateSessionTransfer(userId),
    onSuccess: (data) => {
      setOnboardingToken(data.token);
      setIsFrameLoading(true);
      setIframeKey((prev) => prev + 1);
    },
  });

  const handleOnboardingClick = () => {
    setSelectedMenu('Wallet');
    startSessionTransfer();
  };

  const handleRefresh = () => {
    setIsFrameLoading(true);
    startSessionTransfer();
  };

  const handleIframeLoad = () => {
    setIsFrameLoading(false);
  };

  // Construct iframe URL
  const iframeUrl = onboardingToken
    ? `/ep/onboarding?scenario=scenario3&fullScreen=true&token=${onboardingToken}`
    : '';

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <Paper
        shadow="xs"
        p="md"
        sx={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}
      >
        <Group position="apart">
          <Title order={2}>Sample Dashboard</Title>
          <Group spacing="sm">
            <Avatar radius="xl" color="blue" size={32}>
              JD
            </Avatar>
            <Text weight={500} size="sm">
              John Doe
            </Text>
          </Group>
        </Group>
      </Paper>

      <Group align="flex-start" spacing="lg" mt="md" px="md">
        {/* Sidebar */}
        <Stack spacing="md" sx={{ minWidth: 200 }}>
          <Button
            variant={selectedMenu === 'Overview' ? 'filled' : 'subtle'}
            fullWidth
            onClick={() => setSelectedMenu('Overview')}
          >
            Overview
          </Button>
          <Button
            variant={selectedMenu === 'Analytics' ? 'filled' : 'subtle'}
            fullWidth
            onClick={() => setSelectedMenu('Analytics')}
          >
            Analytics
          </Button>
          <Button
            variant={selectedMenu === 'Reports' ? 'filled' : 'subtle'}
            fullWidth
            onClick={() => setSelectedMenu('Reports')}
          >
            Reports
          </Button>
          <Button
            variant={selectedMenu === 'Team' ? 'filled' : 'subtle'}
            fullWidth
            onClick={() => setSelectedMenu('Team')}
          >
            Team
          </Button>
          <Button
            variant={selectedMenu === 'Wallet' ? 'filled' : 'subtle'}
            fullWidth
            leftIcon={<IconAlertTriangle size={16} color="#eab308" />}
            onClick={handleOnboardingClick}
            loading={isLoading}
            style={{ justifyContent: 'space-between' }}
          >
            Marketplace Wallet
          </Button>
        </Stack>

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {selectedMenu === 'Wallet' ? (
            <>
              <Card shadow="sm" p="lg" mb="md">
                <Group position="apart" mb="md">
                  <Group>
                    <Title order={4}>Onboarding Integration</Title>
                    {onboardingToken && (
                      <Button
                        variant="subtle"
                        size="sm"
                        leftIcon={<IconRefresh size={16} />}
                        onClick={handleRefresh}
                        loading={isLoading}
                      >
                        Refresh Session
                      </Button>
                    )}
                  </Group>
                  <Button
                    variant="subtle"
                    onClick={() => setInstructionsOpen(!instructionsOpen)}
                    rightIcon={
                      instructionsOpen ? (
                        <IconChevronUp size={16} />
                      ) : (
                        <IconChevronDown size={16} />
                      )
                    }
                  >
                    {instructionsOpen ? 'Hide' : 'Show'} Instructions
                  </Button>
                </Group>

                <Collapse in={instructionsOpen}>
                  <Box
                    className={styles.ebMarkdownContainer}
                    sx={{ padding: 'xs', maxWidth: '80vw' }}
                  >
                    <Markdown>{onboardingIntegrationGuideText}</Markdown>
                  </Box>
                </Collapse>

                {isLoading && (
                  <Center py="xl">
                    <Stack align="center" spacing="xs">
                      <Loader size="md" variant="dots" />
                      <Text color="blue" weight={500} size="sm">
                        Initializing session transfer...
                      </Text>
                    </Stack>
                  </Center>
                )}

                {mutationError && (
                  <Text color="red" weight={500} mt="md">
                    {mutationError instanceof Error
                      ? mutationError.message
                      : 'Session transfer failed'}
                  </Text>
                )}

                {onboardingToken && (
                  <Box mt="md">
                    <Text size="sm" weight={500} color="dimmed" mb="xs">
                      Onboarding UI Frame:
                    </Text>
                    <Text size="xs" color="dimmed" mb="xs">
                      <b>Note:</b> For illustration purposes, the iframe src in
                      this example uses a mocked pathname within the same React
                      app. In a real integration, this would point to the actual
                      onboarding UI host.
                    </Text>
                    <Box
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        overflow: 'hidden',
                        position: 'relative',
                        minHeight: 700, // Ensure space for loader when frame is loading
                      }}
                    >
                      {isFrameLoading && (
                        <Center
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(255, 255, 255, 0.9)',
                            zIndex: 1,
                          }}
                        >
                          <Stack align="center" spacing="xs">
                            <Loader size="md" variant="dots" />
                            <Text size="sm" weight={500}>
                              Loading Onboarding UI...
                            </Text>
                          </Stack>
                        </Center>
                      )}
                      <iframe
                        key={iframeKey}
                        title="Onboarding UI"
                        src={iframeUrl}
                        width="100%"
                        height="700"
                        style={{ border: 'none' }}
                        onLoad={handleIframeLoad}
                      />
                    </Box>
                  </Box>
                )}
              </Card>
            </>
          ) : (
            <>
              <SimpleGrid
                cols={3}
                spacing="md"
                mb="lg"
                breakpoints={[{ maxWidth: 'sm', cols: 1 }]}
              >
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Active Users
                  </Text>
                  <Title order={3}>1,245</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Revenue
                  </Text>
                  <Title order={3}>$23,400</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    New Signups
                  </Text>
                  <Title order={3}>320</Title>
                </Card>
              </SimpleGrid>

              <Card shadow="xs" p="lg">
                <Title order={4} mb="sm">
                  Recent Activity
                </Title>
                <Text size="sm" color="dimmed">
                  - User John Doe signed up
                  <br />- Payment of $120 received
                  <br />- Report generated
                  <br />- Team member added
                </Text>
              </Card>
            </>
          )}
        </Box>
      </Group>
    </Box>
  );
};

export default SampleDashboard;
