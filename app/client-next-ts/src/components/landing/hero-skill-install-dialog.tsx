'use client';

import { useCallback, useState } from 'react';
import { Check, ClipboardCopy, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Base URL must match deployed showcase (see hero copy). Path is `/skills/<id>/SKILL.md`. */
const SKILL_INSTALL_CLI =
  'npx skills add https://embedded-finance-dev.com/ --skill efs-components-best-practices';

/**
 * Match sibling hero CTAs: mirror padding/rounding; `border-2 border-transparent` keeps the box
 * the same height as outline buttons that use `border-2 border-sp-brand`.
 */
export type HeroSkillInstallTone =
  /** `HeroSection` — same breakpoints as demos/docs there */
  | 'split'
  /** Default + CompactHomepage2 — `px-7 py-3 text-base` */
  | 'compact'
  /** CompactHomepage1 — `px-8 py-4`, motion-friendly */
  | 'compact-accent'
  /** CompactHomepage3 — pill-shaped like Get Started */
  | 'pill';

const heroSkillToneClasses: Record<HeroSkillInstallTone, string> = {
  split:
    'w-full rounded-page-md px-6 py-3 text-sm font-semibold sm:w-auto sm:px-8 sm:py-4 sm:text-base lg:text-page-body',
  compact:
    'w-full rounded-page-md px-7 py-3 text-base font-semibold sm:w-auto',
  'compact-accent':
    'w-full rounded-page-md px-8 py-4 text-base font-semibold transition-all duration-300 sm:w-auto',
  pill: 'w-full rounded-full px-8 py-3 text-base font-semibold sm:w-auto',
};

interface HeroSkillInstallDialogProps {
  tone?: HeroSkillInstallTone;
}

export function HeroSkillInstallDialog({
  tone = 'compact',
}: HeroSkillInstallDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SKILL_INSTALL_CLI);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          type="button"
          className={cn(
            heroSkillToneClasses[tone],
            'border-2 border-transparent text-sp-brand shadow-none hover:bg-sp-accent hover:text-sp-brand'
          )}
        >
          <Sparkles className="size-5" />
          Install skills
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl border-sp-border bg-jpm-white sm:rounded-page-md">
        <DialogHeader>
          <DialogTitle className="text-page-h3 text-jpm-gray-900">
            Embedded Finance components skill
          </DialogTitle>
          <DialogDescription className="text-left text-page-body text-jpm-gray">
            Lightweight guidance for agents working with this library: canonical
            GitHub markdown links (readme, recipes, onboarding, APIs), showcase
            entry points at{' '}
            <span className="font-medium text-sp-brand">
              embedded-finance-dev.com
            </span>
            , and how to browse engineering recipes without hunting the repo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-page-small leading-relaxed text-jpm-gray">
          <p>
            Skill markdown is hosted at{' '}
            <a
              href="/skills/efs-components-best-practices/SKILL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-medium text-sp-brand underline underline-offset-2 hover:text-sp-brand-700"
            >
              /skills/efs-components-best-practices/SKILL.md
            </a>
            . Use your agent vendor&apos;s CLI if the command below does not
            apply; copying the skill URL works the same way.
          </p>

          <div className="rounded-page-md border border-jpm-gray-200 bg-jpm-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-medium text-jpm-gray-900">
                Example install (npx skills)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-page-md border-sp-brand text-xs font-semibold text-sp-brand hover:bg-sp-accent sm:text-page-small"
                onClick={() => void handleCopyCommand()}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="mr-1 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-page-small text-jpm-gray-900">
              {SKILL_INSTALL_CLI}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
