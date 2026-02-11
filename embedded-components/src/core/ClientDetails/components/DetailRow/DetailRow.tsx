/**
 * DetailRow - Renders a single label/value row (ReviewSection-style).
 */

interface DetailRowProps {
  label: string;
  value: string | string[] | boolean | undefined;
}

function formatValue(value: string | string[] | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function DetailRow({ label, value }: DetailRowProps) {
  const display = formatValue(value);
  if (!display) return null;

  return (
    <div className="eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2 eb-text-sm">
      <dt className="eb-shrink-0 eb-font-medium eb-text-muted-foreground">
        {label}
      </dt>
      <dd className="eb-min-w-0 eb-break-words eb-text-right eb-text-foreground">
        {display}
      </dd>
    </div>
  );
}
