import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  onChange?: (value: Date | null, errorMessage?: string) => void;
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
  maxDate?: Date,
  setErrorMsg?: (errorMessage: string) => void,
  t?: (key: string) => string
) => {
  const dayNum = Number.parseInt(day, 10);
  const monthNum = Number.parseInt(month, 10);
  const yearNum = Number.parseInt(year, 10);

  if (Number.isNaN(dayNum) || Number.isNaN(monthNum) || Number.isNaN(yearNum)) {
    return {
      isValid: false,
      errorMessage:
        t?.('fields.birthDate.validation.format') ??
        'Please enter a valid date in MM/DD/YYYY format',
    };
  }

  if (
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 1000 ||
    yearNum > 9999
  ) {
    return {
      isValid: false,
      errorMessage:
        t?.('fields.birthDate.validation.invalid') ?? 'Invalid date',
    };
  }

  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return {
      isValid: false,
      errorMessage:
        t?.('fields.birthDate.validation.invalid') ?? 'Invalid date',
    };
  }

  if (minDate && date < minDate) {
    return {
      isValid: false,
      errorMessage:
        t?.('fields.birthDate.validation.tooOld') ??
        'Date indicates age over 120 years old. Please verify the date',
    };
  }

  if (maxDate && date > maxDate) {
    return {
      isValid: false,
      errorMessage:
        t?.('fields.birthDate.validation.tooYoung') ??
        'Must be at least 18 years old to proceed',
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
  ...props
}: ImportantDateSelectorProps) {
  const [day, setDay] = useState(() => value?.getDate().toString() ?? '');
  const [month, setMonth] = useState(() =>
    value ? (value.getMonth() + 1).toString().padStart(2, '0') : ''
  );
  const [year, setYear] = useState(() => value?.getFullYear().toString() ?? '');

  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);

  const { t } = useTranslation();

  const updateDate = useCallback(
    (newDay: string, newMonth: string, newYear: string) => {
      const { isValid: newIsValid, errorMessage } = validateDate(
        newDay,
        newMonth,
        newYear,
        minDate,
        maxDate,
        t
      );

      setIsValid(newIsValid);
      if (newIsValid) {
        const newDate = new Date(
          Number.parseInt(newYear, 10),
          Number.parseInt(newMonth, 10) - 1,
          Number.parseInt(newDay, 10)
        );
        isTouched && onChange?.(newDate);
      } else {
        isTouched && onChange?.(null, errorMessage);
      }
    },
    [minDate, maxDate, onChange] // Added onChange to dependencies
  );

  useEffect(() => {
    if (day && month && year) {
      updateDate(day, month, year);
    } else {
      setIsValid(true);
      isTouched && onChange?.(null);
    }
  }, [day, month, year, isTouched]);

  useEffect(() => {
    if (!value) {
      return;
    }

    const newYear = value.getFullYear().toString();
    const newMonth = (value.getMonth() + 1).toString().padStart(2, '0');
    const newDay = value.getDate().toString();

    if (day === '' && month === '' && year === '') {
      setDay(newDay);
      setMonth(newMonth);
      setYear(newYear);
    }
  }, [value]);

  const handleDayChange = (inputValue: string) => {
    const dayNum = Number.parseInt(inputValue, 10);
    if (
      inputValue.length <= 2 &&
      (Number.isNaN(dayNum) || (dayNum >= 1 && dayNum <= 31))
    ) {
      setIsTouched(true);
      setDay(inputValue);
    }
  };

  const handleYearChange = (inputValue: string) => {
    if (inputValue.length <= 4) {
      setIsTouched(true);
      setYear(inputValue);
    }
  };

  const handleMonthChange = (inputValue: string) => {
    setIsTouched(true);
    setMonth(inputValue);
  };

  const handleClear = () => {
    setIsTouched(false);
    setDay('');
    setMonth('');
    setYear('');
    setIsValid(true);
    onChange?.(null);
  };

  const renderField = (type: 'D' | 'Y' | 'M' | string) => {
    switch (type) {
      case 'D':
        return (
          <div className="eb-flex eb-w-12 eb-shrink-0 eb-flex-col eb-gap-1">
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
              className={`eb-w-full ${!isValid || (!day && isTouched) ? 'eb-border-red-500' : ''}`}
              aria-label="Day"
            />
          </div>
        );

      case 'M':
        return (
          <div className="eb-flex eb-w-28 eb-shrink-0 eb-flex-col eb-gap-1">
            <label htmlFor="birth-month" className="eb-text-xs">
              Month
            </label>
            <Select
              value={month}
              onValueChange={handleMonthChange}
              disabled={disabled}
            >
              <SelectTrigger
                id="birth-month"
                className={`eb-w-full ${!isValid || (!month && isTouched) ? 'eb-border-red-500' : ''}`}
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
          <div className="eb-flex eb-w-16 eb-shrink-0 eb-flex-col eb-gap-1">
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
              className={`eb-w-full ${!isValid || (!year && isTouched) ? 'eb-border-red-500' : ''}`}
              aria-label="Year"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="eb-space-y-1">
      <div
        className="eb-flex eb-flex-nowrap eb-items-end eb-gap-1"
        role="group"
        aria-label={props['aria-label'] || 'Date input'}
      >
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
    </div>
  );
}
