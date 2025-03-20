import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  AppShell,
  Box,
  Burger,
  Divider,
  Group,
  Header,
  MediaQuery,
  Navbar,
  RemoveScroll,
  Tabs,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

import { NavbarLinks } from './NavbarLinks/NavbarLinks';
import { NavbarLinksComponentShowcase } from './NavbarLinks/NavbarLinksComponentShowcase';
import { ThemeSelectMenu, ThemeSelectMenuProps } from './ThemeSelectMenu';
import { StoryDrawer, useStoryDrawer } from '../StoryDrawer';

interface LayoutProps {
  themeProps: ThemeSelectMenuProps;
}

export const Layout = ({
  children,
  themeProps,
}: React.PropsWithChildren<LayoutProps>) => {
  const theme = useMantineTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [opened, setOpened] = useState(false);
  const { drawerOpened } = useStoryDrawer();

  const isFullScreen = searchParams.get('fullScreen') === 'true';

  if (isFullScreen) {
    return <>{children}</>;
  }

  // Close navbar on mobile view if route changes
  useEffect(() => {
    setOpened(false);
  }, [location]);

  const lessThanSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const appTitle =
    location?.pathname === '/embedded-components'
      ? 'Embedded Components'
      : 'Embedded Finance Showcase';

  return (
    <AppShell
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          ...(drawerOpened && {
            paddingRight: 'calc(30% + 4px)',
            transform: 'scale(0.98)',
            opacity: 0.98,
          }),
          height: '100vh',
          overflowY: 'auto',
        },
        root: {
          position: 'relative',
          overflow: 'hidden',
        },
      })}
      navbarOffsetBreakpoint="sm"
      fixed
      navbar={
        <Navbar
          p="md"
          hiddenBreakpoint="sm"
          hidden={!opened}
          width={{ sm: 200, lg: 300 }}
        >
          {location?.pathname === '/embedded-components' ? (
            <NavbarLinksComponentShowcase />
          ) : (
            <Tabs defaultValue="EP" variant="pills">
              <Text fw="bold" size="sm" mb="xs">
                Select product
              </Text>
              <Tabs.List grow>
                <Tabs.Tab value="EP">Embedded Payments</Tabs.Tab>
                {/*<Tabs.Tab value="EB">Embedded Banking</Tabs.Tab>*/}
              </Tabs.List>

              <Divider my="sm" />

              <Tabs.Panel value="EB">
                <NavbarLinks product="EB" />
              </Tabs.Panel>

              <Tabs.Panel value="EP">
                <NavbarLinks product="EP" />
              </Tabs.Panel>
            </Tabs>
          )}
        </Navbar>
      }
      header={
        <Header
          height={70}
          p="md"
          className={RemoveScroll.classNames.zeroRight}
        >
          <Group sx={{ height: '100%' }} px={10} position="apart">
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <Text
              weight={700}
              color={
                theme.colorScheme === 'dark'
                  ? theme.colors.gray[4]
                  : theme.colors.dark[4]
              }
            >
              {lessThanSm ? 'EB Showcase' : appTitle}
            </Text>

            <Group spacing={4}>
              <ThemeSelectMenu {...themeProps} />
              <StoryDrawer />
            </Group>
          </Group>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
};
