'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface CodeBlockProps {
  code: string;
  language: string;
  highlight?: number[];
}

export function CodeBlock({ code, language, highlight = [] }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op if clipboard is not available
    }
  };

  const lines = code.split('\n');

  return (
    <Card className="relative flex h-full flex-col overflow-hidden bg-muted/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-card px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {language}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-2 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs md:p-5">
          <code className="font-mono text-[11px] leading-relaxed">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlight.includes(lineNumber);
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className={[
                    'flex',
                    'transition-colors',
                    isHighlighted
                      ? '-mx-4 border-l-2 border-primary bg-primary/5 px-4'
                      : '',
                  ].join(' ')}
                >
                  <span className="mr-4 inline-block w-6 select-none text-right text-[10px] text-muted-foreground/60">
                    {lineNumber}
                  </span>
                  <span className="whitespace-pre-wrap break-words">
                    {line || ' '}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </Card>
  );
}
