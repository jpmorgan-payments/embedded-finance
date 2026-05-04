'use client';

import { useCallback, useState } from 'react';
import { Check, ClipboardCopy, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  STORY_LLM_SOURCES,
  type StoryRecipeIdWithLlm,
} from '@/lib/story-llm-sources';

interface StoryRecipeGithubActionsProps {
  storyId: StoryRecipeIdWithLlm;
}

export function StoryRecipeGithubActions({
  storyId,
}: StoryRecipeGithubActionsProps) {
  const source = STORY_LLM_SOURCES[storyId];
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopyForLlm = useCallback(async () => {
    setCopyError(null);
    try {
      const md = source.getMarkdownCopy();
      await navigator.clipboard.writeText(md);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('Clipboard unavailable. Select text on GitHub instead.');
    }
  }, [source]);

  const handleViewMarkdown = useCallback(() => {
    window.open(source.githubViewUrl, '_blank', 'noopener,noreferrer');
  }, [source]);

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-page-md font-semibold text-sp-brand shadow-none hover:bg-sp-accent hover:text-sp-brand"
        onClick={handleCopyForLlm}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied for LLM
          </>
        ) : (
          <>
            <ClipboardCopy className="h-4 w-4" />
            Copy for LLM
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-page-md font-semibold text-sp-brand shadow-none hover:bg-sp-accent hover:text-sp-brand"
        onClick={handleViewMarkdown}
      >
        <FileText className="h-4 w-4" />
        View as Markdown
      </Button>

      {copyError ? (
        <span className="text-sm text-amber-800">{copyError}</span>
      ) : null}
    </div>
  );
}
