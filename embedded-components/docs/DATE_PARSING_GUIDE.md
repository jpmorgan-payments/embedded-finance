# JavaScript/TypeScript Date Parsing Guide

This guide covers common date parsing issues in JavaScript/TypeScript and their solutions, with a focus on reliable date handling in the Embedded Banking components.

## Common Issues and Solutions

### 1. Timezone Shifts

**Problem:**

```ts
new Date('1945-01-30').toLocaleDateString(); // May show January 29 in some timezones
```

**Solution:**

```ts
// Option 1: Force UTC in formatting
new Date('1945-01-30').toLocaleDateString('default', {
  timeZone: 'UTC',
  // other options...
});

// Option 2: Create date in local timezone
const [year, month, day] = '1945-01-30'.split('-');
new Date(Number(year), Number(month) - 1, Number(day));
```

### 2. Ambiguous Date Formats

**Problem:**

```ts
new Date('05-05-2023'); // MM-DD or DD-MM? Browser-dependent!
```

**Solution:**

```ts
// Always use ISO 8601 format (YYYY-MM-DD)
new Date('2023-05-05');

// Or parse manually if format is fixed
function parseDate(dateStr: string, format: 'MM-DD-YYYY' | 'DD-MM-YYYY') {
  const [first, second, year] = dateStr.split('-');
  const month = format === 'MM-DD-YYYY' ? first : second;
  const day = format === 'MM-DD-YYYY' ? second : first;
  return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}
```

### 3. Invalid Date String Formats

**Problem:**

```ts
new Date('2023.05.05'); // May work in some browsers, fail in others
```

**Solution:**

```ts
// Convert to ISO format first
const toISODate = (dateStr: string) =>
  dateStr
    .replace(/[./]/g, '-')
    .split('-')
    .reverse()
    .map((p) => p.padStart(2, '0'))
    .join('-');
```

### 4. Two-Digit Years

**Problem:**

```ts
new Date('23-05-05'); // Ambiguous century
```

**Solution:**

```ts
function normalizeYear(yearStr: string) {
  const year = Number(yearStr);
  return year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
}
```

### 5. Browser Inconsistencies

**Problem:**

```ts
// Different browsers may parse these differently
new Date('2023/05/05');
new Date('05/05/2023');
```

**Solution:**

```ts
function safeDateParse(dateStr: string) {
  // Normalize separators and ensure YYYY-MM-DD
  const normalized = dateStr
    .replace(/[/.-]/g, '-')
    .split('-')
    .map((p) => p.padStart(2, '0'));

  if (normalized[0].length === 4) {
    return new Date(`${normalized[0]}-${normalized[1]}-${normalized[2]}`);
  }
  // Assume MM-DD-YYYY if year is last
  return new Date(`${normalized[2]}-${normalized[0]}-${normalized[1]}`);
}
```

### 6. Date Display Formatting

**Problem:**

```ts
new Date(val).toLocaleDateString('default', {
  month: 'long',
  day: '2-digit',
  year: 'numeric',
}); // Timezone issues
```

**Solution:**

```ts
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('default', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC', // Prevent timezone shifts
  });
}
```

## Best Practices

1. **Always Use ISO 8601:**

   ```ts
   const date = new Date('2023-05-05T00:00:00Z'); // Explicit UTC
   ```

2. **Create Utility Functions:**

   ```ts
   const dateUtils = {
     parse: (dateStr: string) => new Date(`${dateStr}T00:00:00Z`),
     format: (date: Date) =>
       date.toLocaleDateString('default', {
         month: 'long',
         day: '2-digit',
         year: 'numeric',
         timeZone: 'UTC',
       }),
   };
   ```

3. **Handle Timezones Explicitly:**

   ```ts
   function createDateInLocalTimezone(
     year: number,
     month: number,
     day: number
   ) {
     return new Date(year, month - 1, day, 0, 0, 0);
   }
   ```

4. **Validate Dates:**

   ```ts
   function isValidDate(dateStr: string): boolean {
     const date = new Date(dateStr);
     return date instanceof Date && !isNaN(date.getTime());
   }
   ```

5. **Consider Using a Date Library:**
   - [`date-fns`](https://date-fns.org/) for functional programming approach
   - [`dayjs`](https://day.js.org/) for lightweight solution

## Implementation in Embedded Finance Components

When implementing date handling in the Embedded Finance components:

1. Always use UTC for storing and transmitting dates
2. Use explicit timezone handling when displaying dates to users
3. Validate date inputs before processing
4. Consider the user's locale for date formatting
5. Use consistent date formats across the application
