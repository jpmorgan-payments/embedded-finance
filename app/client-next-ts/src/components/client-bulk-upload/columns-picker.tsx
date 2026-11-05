import { useEffect, useRef, useState } from 'react';
import { Columns3, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  groupsOf,
  type DetailGroupId,
  type PartyKind,
} from '@/lib/client-bulk-upload/details';
import { cn } from '@/lib/utils';

interface ColumnsPickerProps {
  enabled: ReadonlySet<DetailGroupId>;
  /** Groups that hold data; they always stay visible. */
  inUse: ReadonlySet<DetailGroupId>;
  onToggle: (group: DetailGroupId, on: boolean) => void;
}

const SECTIONS: { party: PartyKind; title: string }[] = [
  { party: 'business', title: 'Business' },
  { party: 'person', title: 'Authorized user' },
];

export function ColumnsPicker({
  enabled,
  inUse,
  onToggle,
}: ColumnsPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shownCount = new Set([...enabled, ...inUse]).size;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-tour="columns-button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
      >
        <Columns3 aria-hidden />
        Optional columns
        {shownCount > 0 ? (
          <span className="rounded-full bg-sp-brand px-1.5 text-[10px] font-semibold leading-4 text-white">
            {shownCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-label="Optional columns"
          className="absolute left-0 top-full z-40 mt-2 w-[22rem] rounded-lg border border-jpm-gray-200 bg-white p-3 shadow-xl"
        >
          <p className="text-xs text-jpm-gray-600">
            Add columns for details you already have. All of them are optional;
            leave them off if you don’t have the information.
          </p>
          {SECTIONS.map((section) => (
            <fieldset key={section.party} className="mt-3">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-jpm-gray-600">
                {section.title}
              </legend>
              <ul className="space-y-1" role="list">
                {groupsOf(section.party).map((group) => {
                  const locked = inUse.has(group.id);
                  const checked = locked || enabled.has(group.id);
                  return (
                    <li key={group.id}>
                      <label
                        className={cn(
                          'flex items-start gap-2 rounded-md px-2 py-1.5 text-sm',
                          locked
                            ? 'cursor-default'
                            : 'cursor-pointer hover:bg-jpm-gray-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={(event) =>
                            onToggle(group.id, event.target.checked)
                          }
                          className="mt-0.5 size-4 accent-sp-brand"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 font-medium text-jpm-gray-900">
                            {group.label}
                            {locked ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-xs font-normal text-jpm-gray-500"
                                title="This column group has data, so it stays visible"
                              >
                                <Lock className="size-3" aria-hidden />
                                has data
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-xs text-jpm-gray-500">
                            {group.description}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
          <p className="mt-3 border-t border-jpm-gray-100 pt-2 text-xs text-jpm-gray-500">
            Details for other owners and controllers can be added in the{' '}
            <strong>One at a time</strong> view.
          </p>
        </div>
      ) : null}
    </div>
  );
}
