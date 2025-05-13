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
  UnstyledButton,
  SegmentedControl,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconHome,
  IconBook,
  IconTag,
  IconShoppingCart,
  IconCreditCard,
  IconArrowsLeftRight,
  IconWallet,
  IconChartBar,
  IconChartPie,
  IconTrendingUp,
  IconSettings,
  IconWorld,
  IconUser,
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

// Sidebar menu data
const sidebarMenu = [
  { key: 'Overview', label: 'Home', icon: IconHome },
  { key: 'Catalog', label: 'Catalog', icon: IconBook },
  { key: 'Pricing', label: 'Pricing', icon: IconTag },
  { key: 'Orders', label: 'Orders', icon: IconShoppingCart },
  { key: 'Payments', label: 'Payments', icon: IconCreditCard },
  { key: 'Transactions', label: 'Transactions', icon: IconArrowsLeftRight },
];

const analyticsMenu = [
  { key: 'Performance', label: 'Performance', icon: IconChartBar },
  { key: 'Analytics', label: 'Analytics', icon: IconChartPie },
  { key: 'Growth', label: 'Growth', icon: IconTrendingUp },
];

const scenarioDescriptions: Record<'1' | '2' | '3', string> = {
  '1': 'Start onboarding for a brand new client (no prior data).',
  '2': 'Continue onboarding for a client with existing data or onboarding already in progress.',
  '3': 'Resume onboarding when additional documents are requested from the client.',
};

// Session transfer API call
async function initiateSessionTransfer(userId: string) {
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
}

interface SidebarButtonProps {
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}

const SidebarButton: FC<SidebarButtonProps> = ({
  label,
  icon: Icon,
  selected,
  onClick,
}) => (
  <UnstyledButton
    onClick={onClick}
    sx={(theme) => ({
      display: 'block',
      width: '100%',
      padding: '10px 16px',
      borderRadius: 6,
      background: selected ? '#fff4e6' : 'transparent',
      color: selected ? theme.colors.orange[7] : theme.colors.gray[7],
      fontWeight: selected ? 600 : 400,
      cursor: 'pointer',
      textAlign: 'left',
      '&:hover': {
        background: '#fff4e6',
        color: theme.colors.orange[7],
      },
    })}
  >
    <Group spacing={8} align="center" noWrap>
      <Icon size={18} />
      <span>{label}</span>
    </Group>
  </UnstyledButton>
);

const WalletSidebarButton: FC<{ selected: boolean; onClick: () => void }> = ({
  selected,
  onClick,
}) => (
  <UnstyledButton
    onClick={onClick}
    sx={{
      display: 'block',
      width: '100%',
      padding: '10px 16px',
      borderRadius: 6,
      background: '#fffbe6',
      border: '1px solid #ffe066',
      color: '#b08900',
      fontWeight: 600,
      textAlign: 'left',
      boxShadow: selected ? '0 0 0 2px #ffe066' : undefined,
      cursor: 'pointer',
      '&:hover': { background: '#fff9db' },
    }}
  >
    <Group spacing={8} align="center" noWrap>
      <IconAlertTriangle size={18} color="#eab308" />
      <span>SellSense Wallet</span>
    </Group>
  </UnstyledButton>
);

const Sidebar: FC<{
  selectedMenu: string;
  setSelectedMenu: (key: string) => void;
  handleOnboardingClick: () => void;
}> = ({ selectedMenu, setSelectedMenu, handleOnboardingClick }) => (
  <Paper
    shadow="xs"
    p={0}
    sx={{
      minWidth: 240,
      maxWidth: 260,
      width: 240,
      background: '#fff',
      borderRight: '1px solid #f1f3f5',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
    }}
  >
    <Stack spacing={0} mt="md">
      {sidebarMenu.map((item) => (
        <SidebarButton
          key={item.key}
          label={item.label}
          icon={item.icon}
          selected={selectedMenu === item.key}
          onClick={() => setSelectedMenu(item.key)}
        />
      ))}
      <Text
        size="xs"
        color="gray"
        mt="md"
        mb={4}
        px="md"
        style={{
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 500,
        }}
      >
        Wallet
      </Text>
      <WalletSidebarButton
        selected={selectedMenu === 'Wallet'}
        onClick={handleOnboardingClick}
      />
      <Text
        size="xs"
        color="gray"
        mt="md"
        mb={4}
        px="md"
        style={{
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 500,
        }}
      >
        Analytics
      </Text>
      {analyticsMenu.map((item) => (
        <SidebarButton
          key={item.key}
          label={item.label}
          icon={item.icon}
          selected={selectedMenu === item.key}
          onClick={() => setSelectedMenu(item.key)}
        />
      ))}
    </Stack>
  </Paper>
);

const Header: FC = () => (
  <Paper
    shadow="xs"
    p="md"
    sx={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: '#fff',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #f1f3f5',
    }}
  >
    <Group spacing={8} align="center">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff4e6',
          borderRadius: 6,
          width: 32,
          height: 32,
        }}
      >
        <Text color="orange" weight={700} size="xl">
          S
        </Text>
      </Box>
      <Text size="xl" weight={600} color="orange" ml={4}>
        SellSense
      </Text>
    <Text size="sm" color="gray" weight={500}>
      (Sample/Demo Platform Dashboard)
    </Text>
    </Group>
    <Group spacing={12} align="center">
      <Button
        variant="subtle"
        color="gray"
        radius="xl"
        px={8}
        py={4}
        style={{ minWidth: 0 }}
      >
        <IconWorld size={22} />
      </Button>
      <Button
        variant="subtle"
        color="gray"
        radius="xl"
        px={8}
        py={4}
        style={{ minWidth: 0 }}
      >
        <IconSettings size={22} />
      </Button>
      <Group spacing={8} align="center">
        <Avatar radius="xl" color="blue" size={32}>
          JD
        </Avatar>
        <Text weight={500} size="sm">
          John Doe
        </Text>
      </Group>
    </Group>
  </Paper>
);

export const SampleDashboard: FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string>('Overview');
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'1' | '2' | '3'>(
    '3',
  );

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

  function handleOnboardingClick() {
    setSelectedMenu('Wallet');
    startSessionTransfer();
  }

  function handleRefresh() {
    setIsFrameLoading(true);
    startSessionTransfer();
  }

  function handleIframeLoad() {
    setIsFrameLoading(false);
  }

  // Construct iframe URL
  const iframeUrl = onboardingToken
    ? `/ep/onboarding?scenario=scenario${selectedScenario}&fullScreen=true&token=${onboardingToken}`
    : '';

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <Group
        align="flex-start"
        spacing={0}
        noWrap
        sx={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <Sidebar
          selectedMenu={selectedMenu}
          setSelectedMenu={setSelectedMenu}
          handleOnboardingClick={handleOnboardingClick}
        />
        {/* Main Content */}
        <Box sx={{ flex: 1, margin: '32px 32px 32px 32px' }}>
          {selectedMenu === 'Wallet' ? (
            <Card shadow="sm" p="lg" mb="md">
              <Group position="apart" mb="md" align="flex-end">
                <Box>
                  <Title order={4} mb={8}>
                    Onboarding Integration
                  </Title>
                  <SegmentedControl
                    value={selectedScenario}
                    onChange={(value) =>
                      setSelectedScenario(value as '1' | '2' | '3')
                    }
                    data={[
                      { label: 'Scenario 1', value: '1' },
                      { label: 'Scenario 2', value: '2' },
                      { label: 'Scenario 3', value: '3' },
                    ]}
                    color="orange"
                    size="md"
                    radius="md"
                    sx={{
                      marginTop: 4,
                      minWidth: 320,
                      background: '#f8fafc',
                      borderRadius: 8,
                      boxShadow: '0 1px 4px 0 #f1f3f5',
                    }}
                  />
                </Box>
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

              <Collapse in={instructionsOpen}>
                <Box
                  className={styles.ebMarkdownContainer}
                  sx={{ padding: 'xs', maxWidth: '80vw' }}
                >
                  <Markdown>{onboardingIntegrationGuideText}</Markdown>
                </Box>
              </Collapse>

              <Box
                mt="sm"
                mb="md"
                p="md"
                sx={{
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #f1f3f5',
                  minHeight: 56,
                }}
              >
                <Text size="sm" color="gray.8" weight={500}>
                  {scenarioDescriptions[selectedScenario]}
                </Text>
              </Box>

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
                      minHeight: 700,
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
                  <Title order={3}>1,482</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Revenue (This Month)
                  </Text>
                  <Title order={3}>$28,430</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    New Signups
                  </Text>
                  <Title order={3}>412</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Conversion Rate
                  </Text>
                  <Title order={3}>4.7%</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Avg. Order Value
                  </Text>
                  <Title order={3}>$67.20</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Refunds (This Month)
                  </Text>
                  <Title order={3}>$1,120</Title>
                </Card>
              </SimpleGrid>

              <Card shadow="xs" p="lg" mb="lg">
                <Title order={4} mb="sm">
                  Recent Activity
                </Title>
                <Stack spacing="xs">
                  <Text size="sm" color="dimmed">
                    [09:12 AM] <b>Order #10432</b> placed by <b>Jane Smith</b>{' '}
                    ($129.99)
                  </Text>
                  <Text size="sm" color="dimmed">
                    [08:57 AM] <b>Refund</b> issued for <b>Order #10421</b>{' '}
                    ($49.99)
                  </Text>
                  <Text size="sm" color="dimmed">
                    [08:45 AM] <b>Product review</b> submitted for{' '}
                    <b>Bluetooth Speaker</b>
                  </Text>
                  <Text size="sm" color="dimmed">
                    [08:30 AM] <b>Inventory alert:</b> <b>Smart Watch</b> stock
                    below 10
                  </Text>
                  <Text size="sm" color="dimmed">
                    [08:10 AM] <b>Order #10430</b> placed by <b>Michael Lee</b>{' '}
                    ($89.00)
                  </Text>
                  <Text size="sm" color="dimmed">
                    [07:55 AM] <b>New user</b> <b>Emily Chen</b> signed up
                  </Text>
                  <Text size="sm" color="dimmed">
                    [07:40 AM] <b>Order #10429</b> placed by <b>David Kim</b>{' '}
                    ($59.50)
                  </Text>
                </Stack>
              </Card>

              <Card shadow="xs" p="lg">
                <Title order={4} mb="sm">
                  Recent Orders
                </Title>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Order #
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Customer
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Product
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px' }}>10432</td>
                        <td style={{ padding: '8px' }}>Jane Smith</td>
                        <td style={{ padding: '8px' }}>Wireless Earbuds</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$129.99</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#22c55e',
                            fontWeight: 500,
                          }}
                        >
                          Paid
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>10431</td>
                        <td style={{ padding: '8px' }}>Emily Chen</td>
                        <td style={{ padding: '8px' }}>Smart Watch</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$199.00</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#f59e42',
                            fontWeight: 500,
                          }}
                        >
                          Pending
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>10430</td>
                        <td style={{ padding: '8px' }}>Michael Lee</td>
                        <td style={{ padding: '8px' }}>Bluetooth Speaker</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$89.00</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#22c55e',
                            fontWeight: 500,
                          }}
                        >
                          Paid
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>10429</td>
                        <td style={{ padding: '8px' }}>David Kim</td>
                        <td style={{ padding: '8px' }}>USB-C Charger</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$59.50</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#ef4444',
                            fontWeight: 500,
                          }}
                        >
                          Refunded
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>10428</td>
                        <td style={{ padding: '8px' }}>Sofia Patel</td>
                        <td style={{ padding: '8px' }}>Wireless Mouse</td>
                        <td style={{ padding: '8px' }}>2024-08-06</td>
                        <td style={{ padding: '8px' }}>$34.99</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#22c55e',
                            fontWeight: 500,
                          }}
                        >
                          Paid
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Box>
              </Card>
            </>
          )}
        </Box>
      </Group>
    </Box>
  );
};

export default SampleDashboard;
