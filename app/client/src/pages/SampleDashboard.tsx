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
  Anchor,
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
  IconStar,
  IconInfoCircle,
} from '@tabler/icons';
// Import SVG directly using Vite's import capabilities
import sellSenseLogo from './../assets/sellSense.svg';
import sllSenseWalletLogo from './../assets/sellSenseWallet.svg';
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

// Main color scheme
const SECONDARY_COLOR = '#2CB9AC';
const SECONDARY_BACKGROUND_COLOR = '#f0fffd';
const PRIMARY_COLOR = '#f55727';
const PRIMARY_BACKGROUND_COLOR = '#fff4e6';
const STATUS_SUCCESS = '#22A06B'; // Accessible green
const STATUS_WARNING = '#F0A03C'; // Accessible orange/yellow
const STATUS_ERROR = '#E53E3E'; // Accessible red
const BACKGROUND_LIGHT = '#F8FAFC'; // Light background

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
      color: selected ? PRIMARY_COLOR : '#4A5568',
      fontWeight: selected ? 600 : 400,
      cursor: 'pointer',
      textAlign: 'left',
      background: selected ? PRIMARY_BACKGROUND_COLOR : 'transparent',
      borderLeft: selected
        ? `5px solid ${PRIMARY_COLOR}`
        : '5px solid transparent',
      '&:hover': {
        background: PRIMARY_BACKGROUND_COLOR,
        color: PRIMARY_COLOR,
      },
    })}
  >
    <Group spacing={8} align="center" noWrap>
      <Icon size={18} color={selected ? PRIMARY_COLOR : undefined} />
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
    sx={(theme) => ({
      display: 'block',
      width: '100%',
      padding: '10px 16px',

      color: selected ? PRIMARY_COLOR : '#4A5568',
      fontWeight: selected ? 600 : 400,
      cursor: 'pointer',
      textAlign: 'left',
      background: selected ? PRIMARY_BACKGROUND_COLOR : 'transparent',
      borderLeft: selected
        ? `5px solid ${PRIMARY_COLOR}`
        : '5px solid transparent',
      '&:hover': {
        background: PRIMARY_BACKGROUND_COLOR,
        color: PRIMARY_COLOR,
      },
    })}
  >
    <Group spacing={8} align="center" noWrap>
      <IconAlertTriangle
        size={18}
        color={selected ? PRIMARY_COLOR : undefined}
      />
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
    <Group spacing={12} align="center">
      <img src={sellSenseLogo} alt="SellSense Logo" height={28} width={184} />
    </Group>

    <Group spacing={12} align="center">
      <Button
        variant="subtle"
        color="orange"
        radius="xl"
        px={4}
        py={4}
        style={{ minWidth: 0 }}
      >
        <IconWorld size={22} color={PRIMARY_COLOR} />
      </Button>
      <Button
        variant="subtle"
        color="orange"
        radius="xl"
        px={4}
        py={4}
        style={{ minWidth: 0 }}
      >
        <IconSettings size={22} color={PRIMARY_COLOR} />
      </Button>
      <Group spacing={8} align="center">
        <Avatar
          radius="xl"
          size={32}
          color="orange"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
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

  const [selectedScenario, setSelectedScenario] = useState<string>('scenario9'); // Default scenario

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
    <Box
      sx={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}
    >
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
              <Group align="center" spacing={12} mb="xl">
                <img
                  src={sllSenseWalletLogo}
                  alt="SellSense Wallet Logo"
                  height={72}
                  width={230}
                />
              </Group>
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
                  size="md"
                  color="teal"
                  leftIcon={
                    instructionsOpen ? (
                      <IconChevronUp size={20} />
                    ) : (
                      <IconChevronDown size={20} />
                    )
                  }
                  onClick={() => setInstructionsOpen((open) => !open)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 6,
                    color: SECONDARY_COLOR,
                    fontWeight: 600,
                    textAlign: 'left',
                    background: instructionsOpen
                      ? SECONDARY_BACKGROUND_COLOR
                      : 'transparent',
                    transition: 'background 0.2s',
                    '&:hover': {
                      background: SECONDARY_BACKGROUND_COLOR,
                      color: SECONDARY_COLOR,
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
              <Title order={2} mb="lg" weight={900} sx={{ letterSpacing: 1 }}>
                Welcome, John!
              </Title>
              <SimpleGrid
                cols={3}
                spacing="md"
                mb="lg"
                breakpoints={[{ maxWidth: 'sm', cols: 1 }]}
              >
                <Card
                  shadow="md"
                  p="xl"
                  radius={12}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    background: BACKGROUND_LIGHT,
                  }}
                >
                  <Box
                    sx={{
                      background: SECONDARY_BACKGROUND_COLOR,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconShoppingCart size={36} color={SECONDARY_COLOR} />
                  </Box>
                  <Box>
                    <Text
                      size="md"
                      color="dimmed"
                      weight={500}
                      mb={2}
                      style={{ letterSpacing: 1 }}
                    >
                      Today's Orders
                    </Text>
                    <Title
                      order={2}
                      style={{
                        color: SECONDARY_COLOR,
                        fontWeight: 600,
                        fontSize: 30,
                      }}
                    >
                      12
                    </Title>
                  </Box>
                </Card>
                <Card
                  shadow="md"
                  p="xl"
                  radius={12}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    background: BACKGROUND_LIGHT,
                  }}
                >
                  <Box
                    sx={{
                      background: SECONDARY_BACKGROUND_COLOR,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconTag size={36} color={SECONDARY_COLOR} />
                  </Box>
                  <Box>
                    <Text
                      size="md"
                      color="dimmed"
                      weight={500}
                      mb={2}
                      style={{ letterSpacing: 1 }}
                    >
                      Unshipped Orders
                    </Text>
                    <Title
                      order={2}
                      style={{
                        color: SECONDARY_COLOR,
                        fontWeight: 600,
                        fontSize: 30,
                      }}
                    >
                      3
                    </Title>
                  </Box>
                </Card>
                <Card
                  shadow="md"
                  p="xl"
                  radius={12}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    background: BACKGROUND_LIGHT,
                  }}
                >
                  <Box
                    sx={{
                      background: SECONDARY_BACKGROUND_COLOR,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconStar size={36} color={SECONDARY_COLOR} />
                  </Box>
                  <Box>
                    <Text
                      size="md"
                      color="dimmed"
                      weight={500}
                      mb={2}
                      style={{ letterSpacing: 1 }}
                    >
                      Avg. Rating
                    </Text>
                    <Title
                      order={2}
                      style={{
                        color: SECONDARY_COLOR,
                        fontWeight: 600,
                        fontSize: 30,
                      }}
                    >
                      4.8
                    </Title>
                  </Box>
                </Card>
                <Card
                  shadow="md"
                  p="xl"
                  radius={12}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    background: BACKGROUND_LIGHT,
                  }}
                >
                  <Box
                    sx={{
                      background: SECONDARY_BACKGROUND_COLOR,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconWallet size={36} color={SECONDARY_COLOR} />
                  </Box>
                  <Box>
                    <Text
                      size="md"
                      color="dimmed"
                      weight={500}
                      mb={2}
                      style={{ letterSpacing: 1 }}
                    >
                      Current Balance
                    </Text>
                    <Title
                      order={2}
                      style={{
                        color: SECONDARY_COLOR,
                        fontWeight: 600,
                        fontSize: 30,
                      }}
                    >
                      $2,430.00
                    </Title>
                  </Box>
                </Card>
                <Card
                  shadow="md"
                  p="xl"
                  radius={12}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    background: BACKGROUND_LIGHT,
                  }}
                >
                  <Box
                    sx={{
                      background: SECONDARY_BACKGROUND_COLOR,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCreditCard size={36} color={SECONDARY_COLOR} />
                  </Box>
                  <Box>
                    <Text
                      size="md"
                      color="dimmed"
                      weight={500}
                      mb={2}
                      style={{ letterSpacing: 1 }}
                    >
                      Next Payout
                    </Text>
                    <Title
                      order={2}
                      style={{
                        color: SECONDARY_COLOR,
                        fontWeight: 600,
                        fontSize: 30,
                      }}
                    >
                      $1,200.00
                    </Title>
                  </Box>
                </Card>
              </SimpleGrid>

              <Group
                align="flex-start"
                spacing="lg"
                grow
                noWrap
                sx={{
                  width: '100%',
                  height: 440,
                  flexWrap: 'nowrap',
                  '@media (max-width: 900px)': {
                    flexDirection: 'column',
                    height: 'auto',
                  },
                }}
              >
                <Card
                  shadow="xs"
                  p="lg"
                  sx={{
                    width: '35%',
                    minWidth: 260,
                    maxWidth: 420,
                    height: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '@media (max-width: 900px)': {
                      width: '100%',
                      minWidth: 0,
                    },
                  }}
                >
                  <Title order={4} mb="sm">
                    Orders per Day
                  </Title>
                  <Box
                    sx={{
                      width: '100%',
                      height: 320,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="100%"
                      height="200"
                      viewBox="0 0 320 200"
                      style={{ maxWidth: 340 }}
                    >
                      <polyline
                        fill="none"
                        stroke={SECONDARY_COLOR}
                        strokeWidth="3"
                        points="10,180 60,120 110,140 160,80 210,100 260,60 310,40"
                      />
                      {/* Dots */}
                      <circle cx="10" cy="180" r="5" fill={SECONDARY_COLOR} />
                      <circle cx="60" cy="120" r="5" fill={SECONDARY_COLOR} />
                      <circle cx="110" cy="140" r="5" fill={SECONDARY_COLOR} />
                      <circle cx="160" cy="80" r="5" fill={SECONDARY_COLOR} />
                      <circle cx="210" cy="100" r="5" fill={SECONDARY_COLOR} />
                      <circle cx="260" cy="60" r="5" fill={SECONDARY_COLOR} />
                      <circle cx="310" cy="40" r="5" fill={SECONDARY_COLOR} />
                      {/* X axis labels */}
                      <text x="10" y="195" fontSize="12" fill="#888">
                        Aug 1
                      </text>
                      <text x="60" y="195" fontSize="12" fill="#888">
                        Aug 2
                      </text>
                      <text x="110" y="195" fontSize="12" fill="#888">
                        Aug 3
                      </text>
                      <text x="160" y="195" fontSize="12" fill="#888">
                        Aug 4
                      </text>
                      <text x="210" y="195" fontSize="12" fill="#888">
                        Aug 5
                      </text>
                      <text x="260" y="195" fontSize="12" fill="#888">
                        Aug 6
                      </text>
                      <text x="310" y="195" fontSize="12" fill="#888">
                        Aug 7
                      </text>
                      {/* Y axis label */}
                      <text x="0" y="20" fontSize="12" fill="#888">
                        Orders
                      </text>
                    </svg>
                  </Box>
                </Card>
                <Card
                  shadow="xs"
                  p="lg"
                  sx={{
                    width: '65%',
                    minWidth: 400,
                    maxWidth: '100%',
                    height: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    '@media (max-width: 900px)': {
                      width: '100%',
                      minWidth: 0,
                      marginBottom: 24,
                    },
                  }}
                >
                  <Title order={4} mb="sm">
                    Recent Orders
                  </Title>
                  <Box sx={{ overflowX: 'auto', flex: 1 }}>
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse' }}
                    >
                      <thead>
                        <tr style={{ background: BACKGROUND_LIGHT }}>
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
                          <td style={{ padding: '8px' }}>2024-08-07</td>
                          <td style={{ padding: '8px' }}>$59.99</td>
                          <td
                            style={{
                              padding: '8px',
                              color: STATUS_SUCCESS,
                              fontWeight: 500,
                            }}
                          >
                            Paid
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px' }}>20566</td>
                          <td style={{ padding: '8px' }}>Priya Patel</td>
                          <td style={{ padding: '8px' }}>
                            Bluetooth Headphones
                          </td>
                          <td style={{ padding: '8px' }}>2024-08-07</td>
                          <td style={{ padding: '8px' }}>$120.00</td>
                          <td
                            style={{
                              padding: '8px',
                              color: STATUS_WARNING,
                              fontWeight: 500,
                            }}
                          >
                            Shipped
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px' }}>20565</td>
                          <td style={{ padding: '8px' }}>Samuel Green</td>
                          <td style={{ padding: '8px' }}>
                            Stainless Steel Pan
                          </td>
                          <td style={{ padding: '8px' }}>2024-08-07</td>
                          <td style={{ padding: '8px' }}>$45.50</td>
                          <td
                            style={{
                              padding: '8px',
                              color: STATUS_SUCCESS,
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
                          <td style={{ padding: '8px' }}>2024-08-06</td>
                          <td style={{ padding: '8px' }}>$32.00</td>
                          <td
                            style={{
                              padding: '8px',
                              color: STATUS_ERROR,
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
                          <td style={{ padding: '8px' }}>2024-08-06</td>
                          <td style={{ padding: '8px' }}>$24.99</td>
                          <td
                            style={{
                              padding: '8px',
                              color: STATUS_SUCCESS,
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
              </Group>
            </>
          )}
        </Box>
      </Group>

      {/* Demo information tooltip */}
      <Paper
        shadow="sm"
        p="xs"
        sx={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          maxWidth: '500px',
          width: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.85,
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        <IconInfoCircle size={16} color="#666" />
        <Text size="xs" color="dimmed">
          This is a Sample/Demo Platform Dashboard. View the{' '}
          <Anchor
            href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/pages/SampleDashboard.tsx"
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
          >
            source code on GitHub
          </Anchor>
        </Text>
      </Paper>
    </Box>
  );
};

export default SampleDashboard;
