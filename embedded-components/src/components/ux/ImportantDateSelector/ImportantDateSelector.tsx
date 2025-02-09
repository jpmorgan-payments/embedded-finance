import React, { useEffect, useMemo, useState } from 'react';

import {
  Group,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui';

interface ImportantDateSelectorProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value' | 'onError'
  > {
  value?: Date;
  onChange?: (value: Date) => void;
  maxDate?: Date;
  disabled?: boolean;
  format?: 'DMY' | 'YMD' | 'MDY';
  separator?: React.ReactNode;
}

export function ImportantDateSelector({
  value,
  onChange,
  maxDate,
  disabled = false,
  format = 'MDY',
  separator = '',
}: ImportantDateSelectorProps) {
  const [day, setDay] = useState(value ? value.getDate().toString() : '');
  const [month, setMonth] = useState(
    value ? (value.getMonth() + 1).toString() : ''
  );
  const [year, setYear] = useState(value ? value.getFullYear().toString() : '');

  // Update effect to include validation
  useEffect(() => {
    if (day && month && year) {
      if (onChange) {
        const newDate = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10)
        );

        onChange(newDate);
      }
    }
  }, [day, month, year, onChange, maxDate, value]);

  const generateMonthOptions = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => ({
      value: (end - i).toString(),
      label: (end - i).toString(),
    }));
  };

  const monthOptions = useMemo(() => generateMonthOptions(1, 12), []);

  const renderField = (type: 'D' | 'Y' | 'M' | string) => {
    switch (type) {
      case 'D':
        return (
          <div className="eb-flex eb-flex-col eb-gap-1">
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
              onChange={(e) => {
                const inputValue = e.target.value.replace(/\D/g, '');
                if (inputValue.length <= 2) {
                  setDay(inputValue);
                }
              }}
              disabled={disabled}
              className="eb-w-[50px]"
              aria-label="Day"
            />
          </div>
        );

      case 'M':
        return (
          <div className="eb-flex eb-flex-col eb-gap-1">
            <label htmlFor="birth-month" className="eb-text-xs">
              Month
            </label>
            <Select
              onValueChange={(val: string) => setMonth(val)}
              value={month ? month.padStart(2, '0') : undefined}
              disabled={disabled}
            >
              <SelectTrigger id="birth-month" className="eb-w-[100px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions?.map((item) => (
                  <SelectItem
                    value={item.value.padStart(2, '0')}
                    key={`${item.value}M`}
                  >
                    {new Date(
                      2000,
                      parseInt(item.value, 10) - 1,
                      1
                    ).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'Y':
        return (
          <div className="eb-flex eb-flex-col eb-gap-1">
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
              onChange={(e) => {
                const inputValue = e.target.value.replace(/\D/g, '');
                if (inputValue.length <= 4) {
                  setYear(inputValue);
                }
              }}
              disabled={disabled}
              className="eb-w-[60px]"
              aria-label="Year"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Group className="eb-items-baseline">
        {format.split('').map((type, index) => (
          <React.Fragment key={type}>
            {renderField(type)}
            {index < format.length - 1 && (
              <span className="eb-text-gray-500">{separator}</span>
            )}
          </React.Fragment>
        ))}
      </Group>
    </>
  );
}
