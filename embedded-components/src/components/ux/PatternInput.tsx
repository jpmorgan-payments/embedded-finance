import * as React from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { Input } from '@/components/ui/input';

interface PatternInputProps extends PatternFormatProps {
  /** Whether to obfuscate the value when the input is not focused */
  obfuscateWhenUnfocused?: boolean;
}

function obfuscateValue(
  valueToObfuscate: string,
  visibleDigits = 4,
  format?: string
) {
  if (!valueToObfuscate) return '';
  const len = valueToObfuscate.length;
  if (len <= visibleDigits) return valueToObfuscate;

  const obfuscatedValue =
    '*'.repeat(len - visibleDigits) + valueToObfuscate.slice(-visibleDigits);

  // Apply format if provided
  if (format) {
    let formattedValue = '';
    let valueIndex = 0;

    for (let i = 0; i < format.length; i += 1) {
      if (format[i] === '#') {
        if (valueIndex < obfuscatedValue.length) {
          formattedValue += obfuscatedValue[valueIndex];
          valueIndex += 1;
        }
      } else {
        formattedValue += format[i];
      }
    }

    return formattedValue;
  }

  return obfuscatedValue;
}

const PatternInput = React.forwardRef<HTMLInputElement, PatternInputProps>(
  ({ onChange, value, obfuscateWhenUnfocused = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const displayValue =
      isFocused || !obfuscateWhenUnfocused
        ? value
        : obfuscateValue(value as string, 4, props.format);

    return (
      <div className="eb-space-y-1">
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
          displayType={isFocused || !obfuscateWhenUnfocused ? 'input' : 'text'}
          renderText={() => (
            <>
              <Input
                value={displayValue as string}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                {...(props as React.ComponentProps<typeof Input>)}
              />
            </>
          )}
          value={displayValue}
          getInputRef={ref}
          {...props}
        />
      </div>
    );
  }
);

PatternInput.displayName = 'PatternInput';

export { PatternInput };
