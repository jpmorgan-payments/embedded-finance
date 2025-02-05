import React, { FocusEventHandler, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface PatternMaskInputProps {
  maxLength: number;
  masked?: boolean;
  pattern?: string;
  separator?: string | React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export function PatternMaskInput({
  maxLength,
  masked = false,
  pattern,
  separator,
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
      <div className="eb-flex eb-items-center eb-space-x-2">
        <InputOTP
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          pattern={pattern}
        >
          <InputOTPGroup>
            {Array.from({ length: maxLength }).map((_, index) => (
              <React.Fragment key={index}>
                {index > 0 && index % 3 === 0 && (
                  <InputOTPSeparator>{separator}</InputOTPSeparator>
                )}
                <InputOTPSlot
                  index={index}
                  style={
                    showMasked
                      ? ({ WebkitTextSecurity: 'disc' } as any)
                      : undefined
                  }
                />
              </React.Fragment>
            ))}
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
              <Eye className="eb-h-4 eb-w-4" />
            ) : (
              <EyeOff className="eb-h-4 eb-w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
