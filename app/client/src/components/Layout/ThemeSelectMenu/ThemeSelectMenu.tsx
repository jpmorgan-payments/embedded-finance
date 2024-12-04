import { ActionIcon, Menu, useMantineTheme, Drawer, Group } from '@mantine/core';
import { IconBrush, IconCheckbox, IconSquare, IconPalette } from '@tabler/icons';
import { useState } from 'react';
import { ThemeEditorPage } from '../../../pages/ThemeEditorPage';

export interface ThemeSelectMenuProps {
  currentThemeName: string;
  themeNames: string[];
  setThemeName: (themeName: string) => void;
}

export const ThemeSelectMenu = ({
  currentThemeName,
  themeNames,
  setThemeName,
}: ThemeSelectMenuProps) => {
  const theme = useMantineTheme();
  const [drawerOpened, setDrawerOpened] = useState(false);

  return (
    <>
      <Group spacing={4}>
        <Menu width={200}>
          <Menu.Target>
            <ActionIcon size={30} variant="default">
              <IconBrush size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Choose a theme</Menu.Label>
            {themeNames.map((themeName) => (
              <Menu.Item
                key={themeName}
                icon={
                  themeName === currentThemeName ? (
                    <IconCheckbox size={14} />
                  ) : (
                    <IconSquare size={14} />
                  )
                }
                onClick={() => setThemeName(themeName)}
                sx={{
                  backgroundColor:
                    themeName === currentThemeName
                      ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.25)
                      : undefined,
                }}
              >
                {themeName}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
        <ActionIcon size={30} variant="default" onClick={() => setDrawerOpened(true)}>
          <IconPalette size={16} />
        </ActionIcon>
      </Group>

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="md"
        padding="md"
      >
        <ThemeEditorPage />
      </Drawer>
    </>
  );
};
