import * as React from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { Input } from '@/components/ui/input';

interface PatternInputProps extends PatternFormatProps {
  /** Whether to obfuscate the value when the input is not focused.
   * When true, only obfuscates if there was initial data (not user input) */
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
  (
    {
      onChange,
      value,
      obfuscateWhenUnfocused = false,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [inputElement, setInputElement] =
      React.useState<HTMLInputElement | null>(null);

    // Track whether the field had initial data (should be obfuscated) vs user input (should not be obfuscated)
    const hasInitialData = React.useRef(false);

    // Check for initial data on mount
    React.useEffect(() => {
      if (value && typeof value === 'string' && value.length > 0) {
        hasInitialData.current = true;
      }
    }, []); // Only run on mount

    // Effect to focus the input when transitioning from obfuscated to focused state
    React.useEffect(() => {
      if (
        isFocused &&
        obfuscateWhenUnfocused &&
        hasInitialData.current &&
        inputElement
      ) {
        // Small delay to ensure the PatternFormat has finished rendering
        const timeoutId = setTimeout(() => {
          inputElement.focus();
          inputElement.select();
        }, 0);
        return () => clearTimeout(timeoutId);
      }
      return undefined;
    }, [isFocused, obfuscateWhenUnfocused, inputElement]);

    // Expose the input ref to parent components
    React.useImperativeHandle(ref, () => inputElement!, [inputElement]);

    // Ref callback to handle internal focus ref
    const refCallback = React.useCallback((node: HTMLInputElement | null) => {
      setInputElement(node);
    }, []);

    // Combined focus handler that calls both internal and parent handlers
    const handleFocus = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(event);
      },
      [onFocus]
    );

    // Smart obfuscation: only obfuscate if there was initial data AND user hasn't focused yet
    const shouldObfuscate =
      obfuscateWhenUnfocused && hasInitialData.current && !isFocused;

    const displayValue =
      isFocused || !shouldObfuscate
        ? value
        : obfuscateValue(value as string, 4, props.format);

    return (
      <div className="eb-space-y-1">
        {!isFocused && shouldObfuscate ? (
          <Input
            value={displayValue as string}
            onChange={onChange}
            onFocus={handleFocus}
            {...(props as React.ComponentProps<typeof Input>)}
          />
        ) : (
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
            value={displayValue}
            getInputRef={refCallback}
            {...props}
          />
        )}
      </div>
    );
  }
);

PatternInput.displayName = 'PatternInput';

export { PatternInput };
