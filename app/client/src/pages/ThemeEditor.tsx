import { Button, TextInput, Select, ColorInput, NumberInput, Grid, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { useThemes } from '../hooks/useThemes';

export const ThemeEditor = () => {
  const { themes, saveTheme, createTheme } = useThemes();
  const form = useForm({
    initialValues: {
      id: '',
      name: '',
      popoverColor: '',
      popoverForegroundColor: '',
      borderRadius: '',
      buttonBorderRadius: '',
      borderColor: '',
      inputColor: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
    },
  });

  const handleSubmit = (values: any) => {
    if (values.id) {
      saveTheme(values);
    } else {
      createTheme(values);
    }
    form.reset();
  };

  return (
    <PageWrapper title="Theme Editor">
      <Container size="sm">
        <Select
          label="Edit Existing Theme"
          placeholder="Select a theme"
          data={themes.map((theme) => ({ value: theme.id, label: theme.name }))}
          onChange={(value) => {
            const theme = themes.find((t) => t.id === value);
            if (theme) form.setValues(theme);
          }}
          mb="xl"
          clearable
        />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Theme Name"
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Popover Color"
                format="rgba"
                {...form.getInputProps('popoverColor')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ColorInput
                label="Popover Foreground Color"
                format="rgba"
                {...form.getInputProps('popoverForegroundColor')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Border Radius"
                min={0}
                max={100}
                {...form.getInputProps('borderRadius')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Button Border Radius"
                min={0}
                max={100}
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
            <Grid.Col span={12} ta="center">
              <Button type="submit" mt="md">
                {form.values.id ? 'Update Theme' : 'Create Theme'}
              </Button>
            </Grid.Col>
          </Grid>
        </form>
      </Container>
    </PageWrapper>
  );
};