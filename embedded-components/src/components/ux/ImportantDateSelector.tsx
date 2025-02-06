/*
Below is the enhanced requirements document with the requested references and additional technical details.

---

# Date Picker Component Requirements Document

**Component Name:** Date Picker  
**Usage Context:** Banking onboarding (Date of Birth and other memorable dates selection)

---

## 1. Overview

### 1.1 Purpose
To provide an accessible, efficient, and inclusive date entry experience that allows users to enter their date of birth or another memorable date (e.g., the birth of a child, death of a loved one) without friction. The component must minimize user mistakes through clear labeling, robust validation, and clear inline guidance while remaining compliant with best practices and accessibility standards.

### 1.2 Scope
- **Primary Use:** Collecting user date of birth and other significant dates.
- **Alternate Use:** Entering memorable dates for document verification (e.g., dates on passports or credit cards).
- **Target Users:** All users—including keyboard-only, mobile, and assistive technology users.
- **Integration:** Built using atomic ShadCN components integrated with Tailwind CSS for styling. The component props must be fully compatible with the ShadCN input date picker so that it can be used as a replacement without additional refactoring.

### 1.3 Resources and References
For further reading and design guidance, please refer to the following resources:
- [Digital.gov - Create a User Profile: Date of Birth](https://designsystem.digital.gov/patterns/create-a-user-profile/date-of-birth/)
- [Design Notes: Asking for a Date of Birth (Blog)](https://designnotes.blog.gov.uk/2013/12/05/asking-for-a-date-of-birth/)
- [GOV.UK Design System – Dates Pattern](https://design-system.service.gov.uk/patterns/dates/)
- [Gov.uk Tech Blog – Changing the input type for numbers](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/)

---

## 2. Functional Requirements

### 2.1 Date Entry Fields
- **Field Structure:**  
  - **Month:** Use an accessible Select component with Tailwind CSS styling.  
  - **Day:** Use a text input field with the label "Day" and utilize ShadCN inputs for consistency.  
  - **Year:** Use a text input field with the label "Year" consistent with ShadCN styling.

- **Input Types:**  
  - For day and year fields, use `<input type="text" inputmode="numeric">` with built-in patterns (e.g., `pattern="[0-9]*"`) to ensure numeric input without the quirks of native numeric input.
  - The month Select component should feature explicit labeling and be styled via Tailwind CSS.

### 2.2 Field Labels & Ordering
- **Labels:**  
  - Every field must have a visible, clear label ("Month," "Day," "Year") to avoid ambiguity, particularly for users from regions with differing date formats.
- **Field Order:**  
  - The default order will be: Month, then Day, and then Year.  
  - Adapt locale-specific orders if necessary, while ensuring consistency with the provided design guidelines.

### 2.3 Field Behavior
- **No Auto-Advance:**  
  - Do not auto-advance focus from one field to the next. This is crucial to support keyboard-only navigation and error correction.
- **No Visual Separators:**  
  - Avoid placing visual separators between the fields to keep the interface clean.
- **Character Length Limitation:**  
  - Limit day to two digits, month through the Select options, and year to four digits.

### 2.4 Data Entry Validation
- **Client-Side Validation:**  
  - Validate the day, month, and year parts.  
  - Day must be between 1 and 31, month must be valid as per select options, and the year should be a valid four-digit number.  
  - Provide inline examples or guide text (e.g., “01” for day, “2000” for year) to reduce common mistakes.
  - If a one-digit entry is detected where two digits are expected, display an error message explaining the correct format.
  
- **Server-Side Validation:**  
  - Mirror validation rules on the back end to ensure consistency and security.
  - Offer informative error messages (e.g., "Please enter a valid two-digit day with a leading zero if necessary").

### 2.5 Mobile & Touch-Screen Optimization
- **Mobile Devices:**  
  - Enable a numeric keypad by using `inputmode="numeric"` on text inputs to facilitate easy number entry.
- **Input Consistency:**  
  - Text fields should provide a consistent experience across desktop and mobile, avoiding native date picker quirks.

### 2.6 Accessibility
- **Keyboard Navigation & Screen Reader Compatibility:**  
  - Ensure all elements (inputs and select) are fully accessible by keyboard, including proper ARIA labels/roles where necessary.
  - Each control—especially the Select component—must have a persistent and visible label.
- **No Auto-Submission:**  
  - Avoid using scripts to auto-submission or auto-advancing focus, as this may disorient users relying on assistive technologies.

### 2.7 Error Handling and User Feedback
- **Inline Error Messaging:**  
  - Provide context-specific error messages next to each input field whenever validation fails.
- **Guidance on Input Format:**  
  - Include helper text with examples (e.g., "For example: January 19 2000") to reaffirm the expected input format.

---

## 3. Non-Functional Requirements

### 3.1 Usability
- **Streamlined User Experience:**  
  - Ensure the date picker allows for fast and intuitive date entry with a clear separation of month, day, and year.
- **Design Consistency:**  
  - The component must align with the overall design system, using ShadCN and Tailwind CSS for styling to maintain look and feel across the application.

### 3.2 Performance
- **Quick Load Times:**  
  - The component should load efficiently without heavy reliance on JavaScript frameworks.
- **Responsive Design:**  
  - Must be fully responsive and function optimally across different device sizes and orientations.

### 3.3 Security and Privacy
- **Data Collection Justification:**  
  - Collect date of birth or memorable dates only when essential.
  - Clearly communicate to users why this data is needed and how it will be protected.
- **Data Protection:**  
  - Use secure methods for data transmission and storage following relevant data protection regulations (e.g., GDPR).

---

## 4. Technical Implementation

### 4.1 Component Architecture
- **Atomic Design Principles with ShadCN:**  
  - Build the Date Picker using ShadCN atomic components, ensuring modularity and reusability within the banking onboarding ecosystem.
- **Tailwind CSS Styling:**  
  - Use Tailwind CSS to style the components, ensuring they match the overall design language and are fully customizable.
- **Props Compatibility:**  
  - The component props should be fully compatible with the ShadCN input date picker so that it can act as a drop-in replacement for existing date picker components.

### 4.2 Integration and Testing
- **Integration Hooks:**  
  - Provide standard hooks (e.g., `onChange`, `onBlur`, etc.) for easy integration with existing forms and state management systems.
- **Testing:**  
  - Develop comprehensive unit and integration tests for input validation, accessibility, responsiveness, and error handling.
  - Include tests for edge cases, such as invalid input sequences and handling incomplete data.

### 4.3 Browser & Platform Compatibility
- **Modern Web Browsers:**  
  - Ensure compatibility across all current, major web browsers.  
- **Mobile Optimization:**  
  - Verify the component functions correctly on mobile devices, including proper numeric keypad invocation.

---

## 5. User Experience Guidelines

### 5.1 Guidance and Inline Examples
- **Helper Text & Placeholders:**  
  - Use placeholders (e.g., “01”, “2000”) to show the expected input format.
- **Consistent Date Format:**  
  - Ensure consistency with other patterns (e.g., “January 19 2000”) as referenced in the resources above.

### 5.2 Avoid Common Pitfalls
- **No Auto-Advance:**  
  - Avoid practices like auto-advancing or auto-submission that could confuse users or interfere with assistive technology tools.
- **Minimal Input Complexity:**  
  - Favor a simple text-based input method for day and year to reduce user friction compared to longer drop-downs.

---

## 6. Future Considerations

### 6.1 Expanding Date Patterns  
- **Additional Contexts:**  
  - Consider supporting relative dates (e.g., “tomorrow”, “1 day before”) or approximate dates for scheduling purposes in future releases.
  
### 6.2 Localization and Adaptation
- **Locale-specific Formats:**  
  - Investigate and support alternative date formats based on user locale where applicable.
  
### 6.3 Data Analytics and Iterative Improvement
- **User Feedback Integration:**  
  - Collect user interaction data to assess pain points and adjust the component accordingly.
- **Ongoing Testing:**  
  - Engage in continuous testing and research to refine the UX and accessibility further.

---

## 7. Conclusion

This document outlines a comprehensive plan for the Date Picker component, integrating best practices and guidelines from multiple reputable sources. With ShadCN component compatibility and Tailwind CSS styling, the component is designed to deliver a consistent, accessible, and user-friendly experience for capturing essential dates during the banking onboarding process.

*By following this guide, the development team can ensure the Date Picker meets both usability and technical expectations, while remaining fully compatible with the existing ShadCN input datepicker API for a seamless replacement.*

---
*/

import React, { useEffect, useMemo, useState } from 'react';

import {
  Group,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui';

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
