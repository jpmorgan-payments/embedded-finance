import { cn } from '@/lib/utils';

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export function PartyAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'eb-flex eb-size-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-accent eb-text-sm eb-font-semibold eb-text-accent-foreground',
        className
      )}
    >
      {getInitials(name) || '?'}
    </span>
  );
}
