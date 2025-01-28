import { PatternFormat } from 'react-number-format';

import { Input } from '../ui';

export function PatternInput({
  onChange,
  maskFormat,
  maskChar,
  ...props
}: any) {
  if (props.disabled) {
    return <Input {...props} value="" placeholder="N/A" />;
  }
  return (
    <PatternFormat
      customInput={Input}
      format={maskFormat}
      allowEmptyFormatting
      mask={maskChar}
      onValueChange={(event) => {
        if (event?.value) {
          onChange?.(event.value);
        }
      }}
      {...props}
    />
  );
}
