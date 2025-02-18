import * as React from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { Input } from '@/components/ui/input';

const PatternInput = React.forwardRef<HTMLInputElement, PatternFormatProps>(
  ({ onChange, ...props }, ref) => {
    return (
      <PatternFormat
        customInput={Input}
        allowEmptyFormatting
        onValueChange={(values) => {
          if (values?.value) {
            const syntheticEvent = {
              target: {
                value: values.value,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
          }
        }}
        getInputRef={ref}
        {...props}
      />
    );
  }
);
PatternInput.displayName = 'PatternInput';

export { PatternInput };
