/*

# Date Picker Component Requirements Document (Refined)
Component Name: Date Picker
Usage Context: Banking onboarding (Date of Birth and other memorable dates selection)

## 1. Overview

### 1.1 Purpose
To provide an accessible, efficient, and inclusive date entry experience that allows users to enter their date of birth or another memorable date (e.g., birth of a child, passport expiry date, credit card issue date) without friction. The component must minimize user mistakes through clear labeling, robust validation, and clear inline guidance while remaining compliant with best practices and accessibility standards.

**User Research Insights:**

* **Usability Testing Observation:** Users in previous usability testing struggled with ambiguous date field labels, leading to errors in selecting the correct month and year. This highlighted the need for explicitly labeled fields and clear ordering.
* **Common Error Pattern:**  Users frequently entered single-digit days and months (e.g., "1" instead of "01"), indicating a need for inline guidance on the expected format.
* **Assistive Technology Feedback:** Screen reader users reported difficulty with date pickers that auto-advanced focus, disrupting their navigation flow. This reinforces the requirement to avoid auto-advance.

### 1.2 Scope
- **Primary Use:** Collecting user date of birth for KYC (Know Your Customer) and profile creation.
- **Alternate Use:** Entering memorable dates for:
    - Document verification (e.g., dates on passports, credit cards, driver's licenses).
    - Security questions or account recovery.
- **Target Users:** All users, including:
    - Users with disabilities (WCAG 2.1 AA compliance).
    - Keyboard-only users.
    - Screen reader users (NVDA, VoiceOver, JAWS testing required).
    - Mobile and touch-screen users.
    - Older adults and users with varying levels of technical proficiency.
- **Integration:** Built using atomic ShadCN components integrated with Tailwind CSS for styling. The component props must be fully compatible with the ShadCN input date picker API to ensure drop-in replacement capability without refactoring.

### 1.3 Resources and References
For further reading and design guidance, please refer to the following resources:

**Existing Resources (Retained):**
- [Digital.gov - Create a User Profile: Date of Birth](https://designsystem.digital.gov/patterns/create-a-user-profile/date-of-birth/) - *Provides US government design system guidance on collecting date of birth, emphasizing accessibility and user-friendliness.*
- [Design Notes: Asking for a Date of Birth (Blog)](https://designnotes.blog.gov.uk/2013/12/05/asking-for-a-date-of-birth/) - *A blog post from the UK government design team discussing considerations for date of birth input.*
- [GOV.UK Design System – Dates Pattern](https://design-system.service.gov.uk/patterns/dates/) - *The comprehensive dates pattern from the GOV.UK Design System, a leading example of accessible and user-centered design.*
- [Gov.uk Tech Blog – Changing the input type for numbers](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/) - *Explains the rationale behind using `<input type="text" inputmode="numeric">` for number inputs in the GOV.UK Design System.*

**Additional Accessibility Resources:**
- [W3C - WCAG (Web Content Accessibility Guidelines)](https://www.w3.org/WAI/standards-guidelines/wcag/) - *The foundational guidelines for web accessibility. Refer to Success Criteria related to forms, labels, and keyboard navigation.*
- [W3C - ARIA Authoring Practices Guide (APG) - Date Picker Pattern (When Applicable)](https://www.w3.org/WAI/ARIA/apg/patterns/datepicker/) - *While our component uses separate fields and not a full calendar datepicker, the ARIA APG provides valuable insights into accessible date input patterns and considerations. Review for general principles related to labels and keyboard interaction.*
- [WebAIM - Forms Tutorial](https://webaim.org/techniques/forms/) - *A comprehensive tutorial from WebAIM on creating accessible web forms, including input fields and labels, directly relevant to date pickers.*
- [Deque University - Date Picker Accessibility](https://dequeuniversity.com/rules/axe/4.8/date-picker-label) - *A specific rule from Deque's axe accessibility testing tool related to date picker labeling, highlighting common accessibility issues.*

**Component Library & Design System Examples (Prior Art):**
- [Radix UI - Date Picker](https://www.radix-ui.com/primitives/docs/components/date-picker) - *Documentation for the Date Picker component in Radix UI, another popular accessible component library. Can offer insights into API design and implementation approaches.*
- [Material UI - Date/Time Pickers](https://mui.com/components/date-pickers/) - *Documentation for Date/Time Picker components in Material UI.  While Material UI's default pickers can be complex, examining their API and variations can be informative.*
- [Atlassian Design System - Date Picker](https://atlassian.design/components/date-picker/examples) - *Examples and documentation of the Date Picker component in the Atlassian Design System. Provides a practical example from a large product ecosystem.*
- [Lightning Design System (Salesforce) - Datepicker](https://www.lightningdesignsystem.com/components/datepicker/) - *Documentation for the Datepicker component in Salesforce's Lightning Design System. Another example from a major enterprise design system.*

**UX Design Articles & Blog Posts:**
- [Nielsen Norman Group - Date and Time Pickers: Best Practices](https://www.nngroup.com/articles/date-time-pickers/) - *Article from the Nielsen Norman Group discussing best practices for date and time pickers, covering usability considerations.*
- [Baymard Institute - 7 Date Input Field Usability Mistakes](https://baymard.com/blog/date-input-field-usability) - *Article from Baymard Institute outlining common usability mistakes in date input fields, providing valuable insights into what to avoid.*


---

## 2. Functional Requirements

**Priority:** **Must Have** for all requirements in this section unless otherwise noted.

### 2.1 Date Entry Fields
- **Field Structure:**
  - **Month:** Use an accessible `<Select>` component with Tailwind CSS styling. **Rationale:** Select component is generally more accessible and user-friendly for month selection than free-form text input. Considered and rejected text input with auto-suggest due to accessibility concerns and potential for user error in month names.
  - **Day:** Use a text `<input type="text">` field with the label "Day" and utilize ShadCN inputs for consistency.
  - **Year:** Use a text `<input type="text">` field with the label "Year" consistent with ShadCN styling.

- **Input Types:**
  - For day and year fields, use `<input type="text" inputmode="numeric" pattern="[0-9]*">` to ensure numeric input and enable the numeric keypad on mobile devices. **Rationale:** `inputmode="numeric"` optimizes mobile experience. `pattern="[0-9]*"` provides basic client-side numeric validation.  Considered and rejected `<input type="number">` due to inconsistent browser behaviors and styling limitations as highlighted in Gov.uk Tech Blog reference.
  - The month `<Select>` component should feature explicit labeling and be styled via Tailwind CSS.

### 2.2 Field Labels & Ordering
- **Labels:**
  - Every field must have a visible, clear label ("Month," "Day," "Year") positioned above the input field. **Rationale:** Clear labels are crucial for accessibility and usability, especially for users with cognitive disabilities and screen reader users.
- **Field Order:**
  - The default order will be: Month, then Day, and then Year (MDY).
  - **Locale Adaptation (Should Have):**  Adapt locale-specific orders if necessary based on user's browser locale or account settings. Initially prioritize MDY format, and investigate supporting DMY and YMD formats in future iterations based on user locale detection.

### 2.3 Field Behavior
- **No Auto-Advance:**
  - Do not auto-advance focus from one field to the next. **Rationale:** Essential for keyboard navigation and assistive technology compatibility.
- **No Visual Separators:**
  - Avoid placing visual separators between the fields. **Rationale:** Maintains a clean and simplified interface.
- **Character Length Limitation:**
  - Limit day to two digits, month through the `<Select>` options, and year to four digits. **Rationale:** Enforces expected date format and helps prevent errors.

### 2.4 Data Entry Validation
- **Client-Side Validation:**
  - Validate the day, month, and year parts *on blur* of each field and *on form submission*.
  - **Day Validation:** Must be between 1 and 31.
    - **Error Example:** "Please enter a valid day between 1 and 31."
  - **Month Validation:** Must be a valid month selected from the `<Select>` options.
    - **Error Example:** "Please select a month."
  - **Year Validation:** Must be a valid four-digit number representing a year within a reasonable range (e.g., 1900 to current year).
    - **Error Example:** "Please enter a valid four-digit year (e.g., 1980)." "Please enter a year between 1900 and [Current Year]."
  - **Leap Year Validation:** Ensure February 29th is accepted only in leap years.
    - **Error Example:** "Please enter a valid date. February 29th is not valid for this year."
  - **Format Guidance:** Provide inline examples or guide text (e.g., “01” for day, “2000” for year) as placeholders within the input fields and as helper text below the fields.
  - **Two-Digit Day/Month Detection:** If a one-digit entry is detected where two digits are expected for the day, display an error message explaining the correct format.
    - **Error Example:** "Please enter a two-digit day (e.g., 05, 12)."
  - **Validation on Paste:** Implement validation when users paste values into Day and Year fields to ensure data integrity.

- **Server-Side Validation:**
  - Mirror all client-side validation rules on the back end. **Rationale:** Ensures data integrity and security, preventing bypass of client-side checks.
  - Offer informative and consistent error messages that align with client-side messages.

### 2.5 Mobile & Touch-Screen Optimization
- **Mobile Devices:**
  - Enable a numeric keypad by using `inputmode="numeric"` on text inputs for day and year.
- **Input Consistency:**
  - Text fields should provide a consistent experience across desktop and mobile, avoiding native date picker quirks.

### 2.6 Accessibility
- **Keyboard Navigation & Screen Reader Compatibility:**
  - Ensure all elements (inputs and select) are fully accessible via keyboard navigation (Tab order, focus states).
  - Implement proper ARIA attributes and roles where necessary to enhance screen reader compatibility.
  - Each control—especially the `<Select>` component—must have a programmatically associated and visible label.
  - **Accessibility Testing (Must Have):** Conduct accessibility testing using screen readers (NVDA, VoiceOver, JAWS) and automated tools (axe DevTools, WAVE) to ensure WCAG 2.1 AA compliance.

- **No Auto-Submission:**
  - Avoid using scripts for auto-submission or auto-advancing focus. **Rationale:** Can disorient users, especially those relying on assistive technologies.

### 2.7 Error Handling and User Feedback
- **Inline Error Messaging:**
  - Provide context-specific error messages in red text with an error icon (e.g.,  ⚠️) displayed immediately below the relevant input field when validation fails.
  - Highlight the input field with an error state visually (e.g., red border).
- **Guidance on Input Format:**
  - Include helper text with examples (e.g., "For example: January 19 2000") placed below the date input group to reinforce the expected input format.

---

## 3. Non-Functional Requirements

**Priority:** **Must Have** for Usability and Accessibility, **Should Have** for Performance and Security.

### 3.1 Usability
- **Streamlined User Experience:**
  - Ensure the date picker allows for fast and intuitive date entry with a clear separation of month, day, and year.
  - **Usability Metric:** Aim for an average date entry completion time of under **[X milliseconds/seconds]** in usability testing with target users. Track error rate during date entry and aim for a rate below **[Y]%**.  Collect user satisfaction feedback via surveys with a target score of **[Z/5]** or higher.
- **Design Consistency:**
  - The component must align with the overall design system, using ShadCN and Tailwind CSS for styling to maintain look and feel across the application. Consistent visual styling with other form elements in the onboarding flow.

### 3.2 Performance
- **Quick Load Times:**
  - The component should load efficiently with minimal JavaScript overhead.
  - **Performance Metric:** Component load time should be under **[500 milliseconds]** (target, to be refined based on testing).
- **Responsive Design:**
  - Must be fully responsive and function optimally across different device sizes and orientations (desktop, tablet, mobile).

### 3.3 Security and Privacy
- **Data Collection Justification:**
  - Collect date of birth or memorable dates only when essential for the specified purpose.
  - Clearly communicate to users why this data is needed and how it will be protected in the privacy policy and within the onboarding flow context.
- **Data Protection:**
  - Use secure HTTPS for data transmission.
  - Follow relevant data protection regulations (e.g., GDPR, CCPA) for data storage and handling. Ensure input sanitization on the backend to prevent injection vulnerabilities (though less directly related to the date picker component itself).

---

## 4. Technical Implementation

### 4.1 Component Architecture
- **Atomic Design Principles with ShadCN:**
  - Build the Date Picker using ShadCN atomic components, ensuring modularity and reusability within the banking onboarding ecosystem.
- **Tailwind CSS Styling:**
  - Use Tailwind CSS to style the components, ensuring they match the overall design language and are fully customizable via Tailwind configuration.
- **Props Compatibility:**
  - The component props should be fully compatible with the ShadCN input date picker API, supporting at minimum the following key props for drop-in replacement: `id`, `name`, `value`, `onChange`, `onBlur`, `placeholder`, `disabled`, `className`.  Document full prop compatibility in component documentation.

### 4.2 Integration and Testing
- **Integration Hooks:**
  - Provide standard hooks (e.g., `onChange`, `onBlur`, `onFocus`) for seamless integration with existing forms and state management systems (e.g., React Hook Form, Zustand).
- **Testing:**
  - Develop comprehensive unit and integration tests using Jest and React Testing Library.
    - **Unit Tests:** Focus on individual component logic (validation functions, input handling).
    - **Integration Tests:** Verify component behavior within forms, accessibility, responsiveness, and error handling.
  - **Test Cases:** Include tests for:
    - **Valid Dates:**  Various valid dates in different months and years, including edge cases like January 1st, December 31st.
    - **Invalid Dates:**  Invalid dates (Feb 30th, Apr 31st, invalid year format).
    - **Leap Year Dates:** February 29th in leap years and non-leap years.
    - **Date Range (Year):** Dates outside the acceptable year range (if defined).
    - **Non-Numeric Input:**  Attempting to enter non-numeric characters in Day and Year fields.
    - **Empty Fields:**  Submitting the form with empty fields.
    - **Pasting Data:** Pasting valid and invalid date formats into Day and Year fields.
    - **Accessibility:** Test with screen readers (NVDA, VoiceOver, JAWS) and keyboard navigation.
    - **Responsiveness:** Test on different screen sizes and orientations.

### 4.3 Browser & Platform Compatibility
- **Modern Web Browsers (Must Have):**
  - Ensure compatibility and consistent behavior on the following browsers (latest two versions):
    - Chrome (Desktop & Mobile)
    - Firefox (Desktop & Mobile)
    - Safari (Desktop & Mobile)
    - Edge (Desktop)
- **Mobile Optimization:**
  - Verify component functions correctly on iOS and Android devices, including proper numeric keypad invocation and touch interactions.

---

## 5. User Experience Guidelines

### 5.1 Guidance and Inline Examples
- **Helper Text & Placeholders:**
  - Use placeholders within Day and Year input fields (e.g., “DD”, “YYYY”) to show the expected input format.
  - Display helper text below the date input group: "For example: January 19 2000". Use `<small>` tag and a muted text color for helper text.
- **Consistent Date Format:**
  - Maintain consistency with the MDY (Month-Day-Year) format across the entire onboarding flow, unless locale adaptation is implemented.

**Visual Examples:**

* **[Insert Wireframe/Mockup Image here - Date Picker Default State]** - Showing labels, input fields, placeholders, and helper text.
* **[Insert Wireframe/Mockup Image here - Date Picker Focused State]** - Highlighting focused input field.
* **[Insert Wireframe/Mockup Image here - Date Picker Error State]** - Showing inline error message, error icon, and highlighted error field.

**Do's and Don'ts (Visual Summary):**

* **[Insert "Do's" Visual - e.g., Checkmark icon next to "Clear Labels", "Numeric Keypad on Mobile"]**
* **[Insert "Don'ts" Visual - e.g., Cross icon next to "Auto-Advance Focus", "Visual Separators Between Fields"]**

### 5.2 Avoid Common Pitfalls
- **No Auto-Advance:**
  - Emphasize again: Absolutely avoid auto-advancing focus.
- **Minimal Input Complexity:**
  - Stick to the simple text-based input method for day and year and select for month to minimize user friction. Avoid overly complex date selection patterns.

---

## 6. Future Considerations

**Priority:** **Could Have** for all items in this section.

### 6.1 Expanding Date Patterns
- **Date Range Picker (Potential Future Need):** Consider the potential future requirement for a date range picker component for scenarios like "period of employment" or "account history timeframe selection."
- **Relative Dates (Low Priority):**  Exploring support for relative date inputs (e.g., "today", "yesterday", "tomorrow") is a very low priority and should only be considered if user needs and business requirements clearly demonstrate a benefit.

### 6.2 Localization and Adaptation
- **Locale-specific Formats (Phase 1: Investigation, Phase 2: Implementation - Should Have in Phase 2):**
  - **Phase 1: Investigation:** Conduct user research and analyze user data to determine the most relevant locales to support beyond MDY format. Prioritize locales based on user demographics and business needs.
  - **Phase 2: Implementation:** Implement locale-specific date format adaptation (DMY, YMD) based on browser locale or user account settings. Start with supporting **[List specific locales, e.g., UK, Canada, Australia]** in addition to the default US (MDY).

### 6.3 Data Analytics and Iterative Improvement
- **User Feedback Integration:**
  - Continuously monitor user feedback (surveys, support tickets, usability testing) related to the date picker component.
- **A/B Testing Plan (For Iteration):**
  - Plan for A/B testing of different aspects of the date picker UI, such as:
    - Label placement (above vs. inline).
    - Helper text variations.
    - Error message wording.
  - Use analytics to track conversion rates, error rates, and completion times for different variations to identify optimal designs.
- **Ongoing Testing:**
  - Engage in continuous accessibility testing and usability testing throughout the component's lifecycle to identify areas for further refinement and improvement.

---

## 7. Conclusion

This refined document provides a comprehensive plan for the Date Picker component, incorporating user research insights, best practices, and detailed technical specifications. By prioritizing accessibility, usability, and clear communication, this component aims to deliver a user-friendly and error-minimized date entry experience for banking onboarding.  The focus on ShadCN component compatibility and Tailwind CSS styling ensures seamless integration and maintainability within the existing design system.  Continuous testing and iterative improvement will be crucial to ensure the Date Picker remains effective and user-centered over time.

*By diligently following this refined guide, the development team can confidently build a Date Picker that meets both user needs and technical requirements, serving as a robust and accessible replacement for existing ShadCN input datepicker implementations.*

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
