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
  Select,
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
import { onboardingScenarios } from 'data/onboardingScenarios';
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
  const defaultScenario =
    onboardingScenarios.find(
      (s) =>
        s.name === 'Wizard Layout - US LLC (outstanding documents requested)',
    )?.id || onboardingScenarios[0].id;
  const [selectedScenario, setSelectedScenario] =
    useState<string>(defaultScenario);

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
    ? `/ep/onboarding?scenario=${selectedScenario}&fullScreen=true&token=${onboardingToken}`
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
                  <Text size="sm" color="gray" weight={500} mb={4}>
                    Demo Scenarios (emulate various client statuses):
                  </Text>
                  <Select
                    value={selectedScenario}
                    onChange={(value) => value && setSelectedScenario(value)}
                    data={Object.entries(
                      onboardingScenarios.reduce(
                        (acc, s) => {
                          const group = s.component || 'Other';
                          if (!acc[group]) acc[group] = [];
                          acc[group].push({ value: s.id, label: s.name });
                          return acc;
                        },
                        {} as Record<
                          string,
                          { label: string; value: string }[]
                        >,
                      ),
                    ).flatMap(([group, items]) => [
                      { value: group, label: group, disabled: true },
                      ...items,
                    ])}
                    placeholder="Select a scenario"
                    size="md"
                    radius="md"
                    sx={{
                      marginTop: 4,
                      minWidth: 580,
                      maxWidth: 600,
                      width: '100%',
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
              <Group align="center" spacing={8} mb={8}>
                <Button
                  variant="light"
                  size="xs"
                  color="orange"
                  leftIcon={
                    instructionsOpen ? (
                      <IconChevronUp size={20} />
                    ) : (
                      <IconChevronDown size={20} />
                    )
                  }
                  onClick={() => setInstructionsOpen((open) => !open)}
                  sx={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#ff922b',
                    background: instructionsOpen ? '#fff4e6' : '#fffbe6',
                    border: '1px solid #ffe066',
                    borderRadius: 8,
                    boxShadow: '0 1px 4px 0 #ffe066',
                    transition: 'background 0.2s',
                    '&:hover': {
                      background: '#fff4e6',
                      color: '#d97706',
                    },
                  }}
                >
                  {instructionsOpen
                    ? 'Hide Integration Instructions'
                    : 'Show Integration Instructions'}
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
                    Active Vendors
                  </Text>
                  <Title order={3}>245</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Active Buyers
                  </Text>
                  <Title order={3}>3,120</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Total Products
                  </Text>
                  <Title order={3}>8,540</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Orders Today
                  </Text>
                  <Title order={3}>312</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    GMV (This Month)
                  </Text>
                  <Title order={3}>$92,430</Title>
                </Card>
                <Card shadow="sm" p="lg">
                  <Text size="sm" color="dimmed">
                    Returns (This Month)
                  </Text>
                  <Title order={3}>$2,340</Title>
                </Card>
              </SimpleGrid>

              <Card shadow="xs" p="lg" mb="lg">
                <Title order={4} mb="sm">
                  Recent Activity
                </Title>
                <Stack spacing="xs">
                  <Text size="sm" color="dimmed">
                    [10:05 AM] <b>Vendor</b> <b>Urban Styles</b> listed new
                    product <b>Canvas Tote Bag</b>
                  </Text>
                  <Text size="sm" color="dimmed">
                    [09:52 AM] <b>Order #20567</b> placed by <b>Lisa Wong</b>{' '}
                    ($59.99)
                  </Text>
                  <Text size="sm" color="dimmed">
                    [09:40 AM] <b>Order #20566</b> shipped by <b>GadgetHub</b>
                  </Text>
                  <Text size="sm" color="dimmed">
                    [09:25 AM] <b>Buyer</b> <b>Samuel Green</b> signed up
                  </Text>
                  <Text size="sm" color="dimmed">
                    [09:10 AM] <b>Order #20565</b> delivered to{' '}
                    <b>Priya Patel</b>
                  </Text>
                  <Text size="sm" color="dimmed">
                    [08:55 AM] <b>Return</b> initiated for <b>Order #20560</b>{' '}
                    (Bluetooth Headphones)
                  </Text>
                  <Text size="sm" color="dimmed">
                    [08:40 AM] <b>Vendor</b> <b>KitchenPro</b> joined the
                    marketplace
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
                          Buyer
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
                          Vendor
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
                        <td style={{ padding: '8px' }}>20567</td>
                        <td style={{ padding: '8px' }}>Lisa Wong</td>
                        <td style={{ padding: '8px' }}>Canvas Tote Bag</td>
                        <td style={{ padding: '8px' }}>Urban Styles</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$59.99</td>
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
                        <td style={{ padding: '8px' }}>20566</td>
                        <td style={{ padding: '8px' }}>Priya Patel</td>
                        <td style={{ padding: '8px' }}>Bluetooth Headphones</td>
                        <td style={{ padding: '8px' }}>GadgetHub</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$120.00</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#f59e42',
                            fontWeight: 500,
                          }}
                        >
                          Shipped
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>20565</td>
                        <td style={{ padding: '8px' }}>Samuel Green</td>
                        <td style={{ padding: '8px' }}>Stainless Steel Pan</td>
                        <td style={{ padding: '8px' }}>KitchenPro</td>
                        <td style={{ padding: '8px' }}>2024-08-07</td>
                        <td style={{ padding: '8px' }}>$45.50</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#22c55e',
                            fontWeight: 500,
                          }}
                        >
                          Delivered
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>20564</td>
                        <td style={{ padding: '8px' }}>Lisa Wong</td>
                        <td style={{ padding: '8px' }}>Ceramic Vase</td>
                        <td style={{ padding: '8px' }}>Urban Styles</td>
                        <td style={{ padding: '8px' }}>2024-08-06</td>
                        <td style={{ padding: '8px' }}>$32.00</td>
                        <td
                          style={{
                            padding: '8px',
                            color: '#ef4444',
                            fontWeight: 500,
                          }}
                        >
                          Returned
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px' }}>20563</td>
                        <td style={{ padding: '8px' }}>Priya Patel</td>
                        <td style={{ padding: '8px' }}>Wireless Mouse</td>
                        <td style={{ padding: '8px' }}>GadgetHub</td>
                        <td style={{ padding: '8px' }}>2024-08-06</td>
                        <td style={{ padding: '8px' }}>$24.99</td>
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
