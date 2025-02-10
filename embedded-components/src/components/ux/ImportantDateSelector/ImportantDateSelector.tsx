'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImportantDateSelectorProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value' | 'onError'
  > {
  value?: Date;
  onChange?: (value: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  format?: 'DMY' | 'YMD' | 'MDY';
  separator?: React.ReactNode;
  showClearIcon?: boolean;
}

const generateMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, '0'),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
  }));
};

const monthOptions = generateMonthOptions();

const validateDate = (
  day: string,
  month: string,
  year: string,
  minDate?: Date,
  maxDate?: Date
) => {
  const dayNum = Number.parseInt(day, 10);
  const monthNum = Number.parseInt(month, 10);
  const yearNum = Number.parseInt(year, 10);

  if (Number.isNaN(dayNum) || Number.isNaN(monthNum) || Number.isNaN(yearNum)) {
    return { isValid: false, errorMessage: '🛈 Please enter a valid date.' };
  }

  if (
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 1000 ||
    yearNum > 9999
  ) {
    return { isValid: false, errorMessage: '🛈 Please enter a valid date.' };
  }

  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return { isValid: false, errorMessage: '🛈 Please enter a valid date.' };
  }

  if (minDate && date < minDate) {
    return {
      isValid: false,
      errorMessage: `🛈 Date must be on or after ${minDate.toLocaleDateString()}.`,
    };
  }

  if (maxDate && date > maxDate) {
    return {
      isValid: false,
      errorMessage: `🛈 Date must be on or before ${maxDate.toLocaleDateString()}.`,
    };
  }

  return { isValid: true, errorMessage: '' };
};

export function ImportantDateSelector({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  format = 'MDY',
  separator = '',
  showClearIcon = false,
}: ImportantDateSelectorProps) {
  const [day, setDay] = useState(value ? value.getDate().toString() : '');
  const [month, setMonth] = useState(
    value ? (value.getMonth() + 1).toString().padStart(2, '0') : ''
  );
  const [year, setYear] = useState(value ? value.getFullYear().toString() : '');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const updateDate = useCallback(
    (newDay: string, newMonth: string, newYear: string) => {
      const { isValid: newIsValid, errorMessage: newErrorMessage } =
        validateDate(newDay, newMonth, newYear, minDate, maxDate);
      setIsValid(newIsValid);
      setErrorMessage(newErrorMessage);

      if (newIsValid) {
        const newDate = new Date(
          Number.parseInt(newYear, 10),
          Number.parseInt(newMonth, 10) - 1,
          Number.parseInt(newDay, 10)
        );
        onChange?.(newDate);
      } else {
        onChange?.(null);
      }
    },
    [minDate, maxDate, onChange]
  );

  useEffect(() => {
    if (value) {
      setDay(value.getDate().toString());
      setMonth((value.getMonth() + 1).toString().padStart(2, '0'));
      setYear(value.getFullYear().toString());
    }
  }, [value]);

  useEffect(() => {
    if (day && month && year) {
      updateDate(day, month, year);
    } else {
      setIsValid(true);
      setErrorMessage('');
      onChange?.(null);
    }
  }, [day, month, year, updateDate, onChange]);

  const handleDayChange = (inputValue: string) => {
    const dayNum = Number.parseInt(inputValue, 10);
    if (
      inputValue.length <= 2 &&
      (Number.isNaN(dayNum) || (dayNum >= 1 && dayNum <= 31))
    ) {
      setDay(inputValue);
    }
  };

  const handleYearChange = (inputValue: string) => {
    if (inputValue.length <= 4) {
      setYear(inputValue);
    }
  };

  const handleClear = () => {
    setDay('');
    setMonth('');
    setYear('');
    setIsValid(true);
    setErrorMessage('');
    onChange?.(null);
  };

  const renderField = (type: 'D' | 'Y' | 'M' | string) => {
    switch (type) {
      case 'D':
        return (
          <div className="eb-sm:w-14 eb-flex eb-w-12 eb-shrink-0 eb-flex-col eb-gap-1">
            <label htmlFor="birth-day" className="eb-text-xs">
              Day
            </label>
            <Input
              id="birth-day"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="DD"
              value={day}
              onChange={(e) =>
                handleDayChange(e.target.value.replace(/\D/g, ''))
              }
              disabled={disabled}
              className={`eb-w-full ${!isValid ? 'eb-border-red-500' : ''}`}
              aria-label="Day"
            />
          </div>
        );

      case 'M':
        return (
          <div className="eb-sm:w-28 eb-flex eb-w-24 eb-shrink-0 eb-flex-col eb-gap-1">
            <label htmlFor="birth-month" className="eb-text-xs">
              Month
            </label>
            <Select value={month} onValueChange={setMonth} disabled={disabled}>
              <SelectTrigger
                id="birth-month"
                className={`eb-w-full ${!isValid ? 'eb-border-red-500' : ''}`}
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'Y':
        return (
          <div className="eb-sm:w-20 eb-flex eb-w-16 eb-shrink-0 eb-flex-col eb-gap-1">
            <label htmlFor="birth-year" className="eb-text-xs">
              Year
            </label>
            <Input
              id="birth-year"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="YYYY"
              value={year}
              onChange={(e) =>
                handleYearChange(e.target.value.replace(/\D/g, ''))
              }
              disabled={disabled}
              className={`eb-w-full ${!isValid ? 'eb-border-red-500' : ''}`}
              aria-label="Year"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="eb-space-y-2">
      <div className="eb-flex eb-flex-nowrap eb-items-end eb-gap-2">
        {format.split('').map((type, index) => (
          <React.Fragment key={type}>
            {renderField(type)}
            {index < format.length - 1 && (
              <span className="eb-mb-2 eb-text-gray-500">{separator}</span>
            )}
          </React.Fragment>
        ))}
        {showClearIcon && !disabled && (
          <Button
            type="button"
            onClick={handleClear}
            variant="ghost"
            size="icon"
            className="eb-h-10 eb-w-10 eb-shrink-0"
            aria-label="Clear date"
          >
            <X className="eb-h-4 eb-w-4" />
          </Button>
        )}
      </div>
      {!isValid && <p className="eb-text-sm eb-text-red-500">{errorMessage}</p>}
    </div>
  );
}
