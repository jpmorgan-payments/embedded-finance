import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

type WebKitStyle = React.CSSProperties & {
  WebkitTextSecurity?: 'disc' | 'circle' | 'square' | 'none';
};

interface PatternMaskInputProps {
  masked?: boolean;
  pattern?: string;
  format: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function PatternMaskInput({
  masked = false,
  pattern,
  format,
  value,
  onChange,
  onBlur,
}: PatternMaskInputProps) {
  const [showMasked, setShowMasked] = useState(masked);

  const toggleMask = () => {
    setShowMasked(!showMasked);
  };

  return (
    <div className="eb-space-y-2">
      <div className="eb-flex eb-items-center eb-space-x-1">
        <InputOTP
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={format.replace(/[^#]/g, '').length}
          pattern={pattern}
        >
          <InputOTPGroup>
            {format.split('').map((char, index) => {
              return (
                <React.Fragment key={index}>
                  {char === '#' ? (
                    <InputOTPSlot
                      index={
                        index -
                        ((format?.slice(0, index)?.match(/[^#]/g) ?? [])
                          .length ?? 0)
                      }
                      style={
                        showMasked
                          ? ({ WebkitTextSecurity: 'disc' } as WebKitStyle)
                          : {}
                      }
                      className="eb-h-8 eb-w-8"
                    />
                  ) : (
                    <InputOTPSeparator>{char}</InputOTPSeparator>
                  )}
                </React.Fragment>
              );
            })}
          </InputOTPGroup>
        </InputOTP>
        {masked && (
          <Button
            variant="outline"
            size="icon"
            onMouseDown={toggleMask}
            onMouseUp={toggleMask}
            onMouseLeave={() => setShowMasked(true)}
          >
            {showMasked ? (
              <EyeOff className="eb-h-4 eb-w-4" />
            ) : (
              <Eye className="eb-h-4 eb-w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
