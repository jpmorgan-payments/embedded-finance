import { Button, TextInput, Select, ColorInput, NumberInput, Grid, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { useThemes } from '../hooks/useThemes';

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
  const form = useForm({
    initialValues: {
      id: '',
      name: '',
      borderRadius: '',
      buttonBorderRadius: '',
      borderColor: '',
      inputColor: '',
      fontFamily: '',  // Add this line
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