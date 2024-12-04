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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { useThemes } from '../hooks/useThemes';
import { useState } from 'react';
import { set } from 'remeda';

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

export const ThemeEditorPage = () => {
  const { themes, saveTheme, createTheme } = useThemes();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      id: '',
      name: '',
      borderRadius: '',
      buttonBorderRadius: '',
      borderColor: '',
      inputColor: '',
      fontFamily: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
    },
  });

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
        ) : (
          <>
            <Group position="apart" mb="xl">
              <Title order={3}>Edit Existing Theme</Title>
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
