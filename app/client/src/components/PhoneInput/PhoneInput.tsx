import { TextInput, TextInputProps } from '@mantine/core';
import NumberFormat, { NumberFormatProps } from 'react-number-format';

type PhoneInputProps = Omit<TextInputProps, 'placeholder'> &
  Omit<NumberFormatProps, 'customInput' | 'placeholder'>;

export const PhoneInput = ({ onChange, ...props }: PhoneInputProps) => {
  return (
    <NumberFormat
      customInput={TextInput}
      label="Phone Number"
      format="+1 (###) ###-####"
      allowEmptyFormatting
      mask="_"
      onValueChange={({ value }, { event }) => {
        event.currentTarget.value = value;
        onChange?.(event);
      }}
      {...props}
    />
  );
};
