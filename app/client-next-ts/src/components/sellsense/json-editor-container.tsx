'use client';

import React, { useState } from 'react';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonEditorContainerProps {
  initialValue: JsonValue;
  onValueChange: (value: JsonValue) => void;
}

/**
 * Simple uncontrolled JSON editor container.
 *
 * Uses a textarea so the editor is guaranteed to render even when dynamic
 * imports or third-party editors are unavailable. To load a new document,
 * change the React `key` for this component so it re-initializes from
 * `initialValue`.
 */
export function JsonEditorContainer({
  initialValue,
  onValueChange,
}: JsonEditorContainerProps) {
  const [textareaContent, setTextareaContent] = useState(() =>
    JSON.stringify(initialValue, null, 2)
  );

  return (
    <div className="flex h-full min-h-[8rem] flex-col">
      <textarea
        className="min-h-[6rem] flex-1 w-full resize-none border border-gray-300 bg-white p-4 font-mono text-xs leading-relaxed text-gray-900 outline-none"
        value={textareaContent}
        onChange={(e) => {
          setTextareaContent(e.target.value);
          try {
            const next = JSON.parse(e.target.value) as JsonValue;
            onValueChange(next);
          } catch {
            // leave ref unchanged until valid JSON
          }
        }}
        spellCheck={false}
      />
    </div>
  );
}

export type { JsonValue };

