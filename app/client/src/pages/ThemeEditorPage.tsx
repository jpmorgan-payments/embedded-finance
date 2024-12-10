import {
  Button,
  TextInput,
  Select,
  ColorInput,
  NumberInput,
  Grid,
  Container,
  Group,
  Title,
  ActionIcon,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { useThemes } from '../hooks/useThemes';
import { useState, useEffect } from 'react';
import { set } from 'remeda';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconSun, IconMoon } from '@tabler/icons';

const googleFonts = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Ubuntu', label: 'Ubuntu' },
];

export interface ThemeEditorPageProps {
  colorScheme?: 'light' | 'dark';
  toggleColorScheme?: () => void;
}

export const ThemeEditorPage = () => {
  const { themes, saveTheme, createTheme } = useThemes();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      id: '',
      name: '',
      borderRadius: '',
      buttonBorderRadius: '',
      borderColor: '',
      inputColor: '',
      fontFamily: '',
      colorScheme: 'light',
      primaryColor: '',
      primaryColorHover: '',
      secondaryColor: '',
      spacingUnit: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const themeNameFromPath = params.get('theme');
    if (themeNameFromPath) {
      const theme = themes.find((t) => t.id === themeNameFromPath);

      if (theme) {
        setMode('edit');
        form.setValues(theme);
        setSelectedThemeId(theme.id);
      }
    }
  }, [location.pathname, themes]);

  const handleSubmit = (values: any) => {
    if (values.id) {
      saveTheme(values);
      notifications.show({
        title: 'Success',
        message: `Theme "${values.name}" has been updated`,
        color: 'teal',
        autoClose: 3000,
        withCloseButton: true,
        styles: (theme) => ({
          title: { fontWeight: 600 },
          description: { color: theme.colors.gray[6] },
        }),
      });
    } else {
      createTheme(values);
      form.reset();
      setMode('new');
    }
  };

  const handleCancel = () => {
    form.reset();
    setMode('new');
    setSelectedThemeId(null);
  };

  return (
    <PageWrapper title="Theme Editor">
      <Container size="sm">
        {mode === 'new' ? (
          <Group position="apart" mb="xl">
            <Title order={3}>Create New Theme</Title>
            <Text c="dimmed" mb="md">
              Note: Themes are temporarily stored in browser's localStorage.
              Create a theme first, then select it when customizing components.
            </Text>
            <Group>
              <Button
                variant="light"
                onClick={() => {
                  setMode('edit');
                  form.reset();
                  setSelectedThemeId(null);
                }}
              >
                Switch to Edit Existing Theme
              </Button>
            </Group>
          </Group>
        ) : (
          <>
            <Group position="apart" mb="xl">
              <Title order={3}>Edit Existing Theme</Title>
              <Text c="dimmed" mb="md">
                Note: Themes are temporarily stored in browser's localStorage.
                Create a theme first, then select it when customizing
                components.
              </Text>
              <Button
                variant="light"
                onClick={() => {
                  setMode('new');
                  form.reset();
                }}
              >
                Switch to Create New Theme
              </Button>
            </Group>
            <Select
              label="Select Theme to Edit"
              placeholder="Choose a theme"
              value={selectedThemeId}
              data={themes.map((theme) => ({
                value: theme.id,
                label: theme.name,
              }))}
              onChange={(value) => {
                const theme = themes.find((t) => t.id === value);
                if (theme) {
                  form.setValues(theme);
                  setSelectedThemeId(value);
                }
              }}
              mb="xl"
              clearable
            />
          </>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={12}>
              <TextInput label="Theme Name" {...form.getInputProps('name')} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Font Family"
                placeholder="Select a font"
                data={googleFonts}
                {...form.getInputProps('fontFamily')}
                searchable
                clearable
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Select
                label="Color Scheme"
                placeholder="Select color scheme"
                data={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
                {...form.getInputProps('colorScheme')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label="Spacing Unit"
                description="Default: 4px or 0.25rem"
                {...form.getInputProps('spacingUnit')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Border Radius"
                description="e.g. 8px or 0.375rem"
                {...form.getInputProps('borderRadius')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Button Border Radius"
                description="e.g. 8px or 0.375rem"
                {...form.getInputProps('buttonBorderRadius')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Primary Color"
                format="rgba"
                {...form.getInputProps('primaryColor')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Primary Color (hovered)"
                format="rgba"
                {...form.getInputProps('primaryColorHover')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Secondary Color"
                format="rgba"
                {...form.getInputProps('secondaryColor')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Border Color"
                format="rgba"
                {...form.getInputProps('borderColor')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Input Color"
                format="rgba"
                {...form.getInputProps('inputColor')}
              />
            </Grid.Col>
            <Grid.Col span={12} ta="center">
              <Group position="center" mt="xl">
                <Button type="submit">
                  {mode === 'edit' ? 'Update Theme' : 'Create New Theme'}
                </Button>
                {mode === 'edit' && (
                  <Button variant="light" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Container>
    </PageWrapper>
  );
};
