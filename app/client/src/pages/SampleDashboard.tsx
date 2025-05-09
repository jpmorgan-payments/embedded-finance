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
            Wallet
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
                  <SimpleGrid
                    cols={2}
                    spacing="lg"
                    breakpoints={[{ maxWidth: 'md', cols: 1 }]}
                  >
                    {/* Left: Integration Flow & API Reference */}
                    <Card withBorder radius="md" mb="md">
                      <Stack spacing="xs">
                        <Title order={6} color="dimmed">
                          Integration Flow
                        </Title>
                        <Text size="sm">
                          <ol style={{ margin: 0, paddingLeft: '1rem' }}>
                            <li>
                              GET /api/onboarding/clients/:id to get the latest
                              client status. If client status is
                              INFORMATION_REQUESTED, show visual indicator to
                              the user.
                            </li>
                            <li>
                              As soon as the user clicks the Wallet menu item, a
                              corresponding page is rendered and a session
                              transfer API call is invoked.
                            </li>
                            <li>
                              The session transfer API responds with a JWT token
                            </li>
                            <li>
                              The token is appended to the hosted Onboarding UI
                              URL as a "token" query parameter
                            </li>
                            <li>
                              The Onboarding UI is loaded in an inline frame
                              (&lt;iframe&gt;)
                            </li>
                          </ol>
                        </Text>

                        <Text size="sm" mt="xs" color="dimmed">
                          <b>Note:</b> The integration includes two loading
                          states:
                          <ul style={{ margin: '4px 0 0 1rem', padding: 0 }}>
                            <li>
                              Session transfer loading while obtaining the JWT
                              token (shown in the Wallet button)
                            </li>
                            <li>
                              Frame loading while the Onboarding UI initializes
                              (shown as an overlay)
                            </li>
                          </ul>
                        </Text>

                        <Divider my="sm" />

                        <Title order={6} color="dimmed">
                          API Reference
                        </Title>
                        <Box>
                          <Text size="sm" weight={500}>
                            Session Transfer Endpoint:
                          </Text>
                          <Code block>
                            POST /api/onboarding/session-transfer
                          </Code>
                        </Box>

                        <Box>
                          <Text size="sm" weight={500}>
                            Request Payload:
                          </Text>
                          <Code block>{`{
  "userId": "${userId}"
}`}</Code>
                        </Box>

                        <Box>
                          <Text size="sm" weight={500}>
                            Response:
                          </Text>
                          <Code block>{`{
  "token": "mock-jwt-token-12345",
  "userId": "${userId}",
  "expiresIn": 3600
}`}</Code>
                        </Box>

                        <Divider my="sm" />

                        <Title order={6} color="dimmed">
                          Hosted UI Integration
                        </Title>

                        <Box>
                          <Code block>{`<iframe
  title="Onboarding UI"
  src="http://<host>/onboarding?token={jwt}"
  width="100%"
  height="500"
  style={{ border: 'none' }}
/>`}</Code>
                        </Box>
                      </Stack>
                    </Card>

                    {/* Right: Platform Implementation Guidance */}
                    <Card withBorder radius="md" mb="md">
                      <Stack spacing="md">
                        <Title order={6} color="dimmed">
                          Platform Implementation (What Platform Needs to
                          Enhance)
                        </Title>
                        {/* Service Layer Block */}
                        <Accordion variant="separated" multiple>
                          <Accordion.Item value="service-layer">
                            <Accordion.Control>
                              <Text weight={500}>
                                1. Platform Service Layer (Controller/Service
                                Logic)
                              </Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                              <Stack spacing="xs">
                                <Text size="sm">
                                  <b>Responsibilities:</b>
                                </Text>
                                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                  <li>
                                    Invoke the session transfer API endpoint to
                                    obtain a session token for the current user.
                                  </li>
                                  <li>
                                    Optionally, perform additional operations
                                    such as logging, auditing, or updating user
                                    session state.
                                  </li>
                                  <li>
                                    Securely handle and store the JWT token
                                    received from the API.
                                  </li>
                                  <li>
                                    Expose a method or event for the
                                    representation layer to trigger this logic.
                                  </li>
                                </ul>
                                <Text size="sm" color="dimmed">
                                  <b>Note:</b> This logic should be implemented
                                  in platform's backend or service/controller
                                  layer, using preferred language and framework.
                                </Text>
                              </Stack>
                            </Accordion.Panel>
                          </Accordion.Item>

                          {/* Representation Layer Block */}
                          <Accordion.Item value="representation-layer">
                            <Accordion.Control>
                              <Text weight={500}>
                                2. Platform Representation Layer
                                (UI/Presentation)
                              </Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                              <Stack spacing="xs">
                                <Text size="sm">
                                  <b>Responsibilities:</b>
                                </Text>
                                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                  <li>
                                    Trigger the service/controller logic to
                                    obtain a session token when onboarding is
                                    initiated (e.g., user clicks a button).
                                  </li>
                                  <li>
                                    Render the onboarding UI in an{' '}
                                    <code>&lt;iframe&gt;</code>, passing the
                                    session token as a query parameter in the
                                    URL.
                                  </li>
                                  <li>
                                    Display a loading indicator while waiting
                                    for the session token and while the iframe
                                    is loading.
                                  </li>
                                  <li>
                                    Handle and display errors if the session
                                    transfer fails or the iframe cannot load.
                                  </li>
                                  <li>
                                    Optionally, provide a way to refresh the
                                    session and reload the iframe if needed.
                                  </li>
                                  <li>
                                    Ensure the iframe is responsive and
                                    accessible.
                                  </li>
                                  <li>
                                    Use secure iframe attributes (
                                    <code>sandbox</code>,{' '}
                                    <code>referrerpolicy</code>, etc.).
                                  </li>
                                  <li>
                                    (Optional) Use <code>postMessage</code> for
                                    parent-iframe communication if needed.
                                  </li>
                                </ul>
                                <Divider my="xs" />
                                <Text size="sm" weight={500}>
                                  Best Practices & Example:
                                </Text>
                                <Code
                                  block
                                >{`<!-- Responsive container for the iframe -->
<div style="position:relative; width:100%; min-height:500px;">
  <!-- Loader shown while iframe is loading -->
  <div id="iframe-loader" style="display:block; position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.8); z-index:1;">
    Loading onboarding UI...
  </div>
  <iframe
    id="onboarding-iframe"
    src="https://<host>/onboarding?token={jwt}"
    title="Onboarding UI"
    width="100%"
    height="700"
    style="border:none; display:block;"
    allowfullscreen
    referrerpolicy="no-referrer"
    sandbox="allow-scripts allow-same-origin"
    onload="document.getElementById('iframe-loader').style.display='none';"
  ></iframe>
</div>`}</Code>
                                <Text size="sm">
                                  <b>Instructions:</b>
                                </Text>
                                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                  <li>
                                    <b>Responsiveness:</b> Use CSS to ensure the
                                    iframe scales to the parent container. Set
                                    explicit width/height to avoid layout
                                    shifts.
                                  </li>
                                  <li>
                                    <b>Loading State:</b> Show a loader overlay
                                    until the iframe's <code>onload</code> event
                                    fires.
                                  </li>
                                  <li>
                                    <b>Error Handling:</b> Optionally, use a
                                    timeout or the <code>onerror</code> event
                                    (where supported) to display an error
                                    message if the iframe fails to load.
                                  </li>
                                  <li>
                                    <b>Security:</b> Use the{' '}
                                    <code>sandbox</code> attribute to restrict
                                    iframe capabilities. Adjust allowed features
                                    as needed.
                                  </li>
                                  <li>
                                    <b>Accessibility:</b> Always set a
                                    descriptive <code>title</code> on the
                                    iframe.
                                  </li>
                                  <li>
                                    <b>Cross-Domain Communication:</b> If you
                                    need to communicate between the parent and
                                    the iframe (e.g., onboarding completion),
                                    use the <code>window.postMessage</code> API.
                                  </li>
                                  <li>
                                    <b>Refresh:</b> Provide a UI control to
                                    refresh the session and reload the iframe if
                                    needed.
                                  </li>
                                </ul>
                                <Text size="xs" color="dimmed" mt="xs">
                                  References:{' '}
                                  <a
                                    href="https://www.devzery.com/post/guide-to-iframe-examples-best-practices-and-use-cases"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Devzery: Guide to iFrame Best Practices
                                  </a>
                                  ,{' '}
                                  <a
                                    href="https://blog.logrocket.com/ultimate-guide-iframes/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    LogRocket: Ultimate Guide to iFrames
                                  </a>
                                </Text>
                              </Stack>
                            </Accordion.Panel>
                          </Accordion.Item>
                        </Accordion>
                      </Stack>
                    </Card>
                  </SimpleGrid>
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
