import React, { memo } from 'react';

import { useHighlight } from '@/components/ui/highlighter/useHighlight.ts';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';

interface ISyntaxHighlighterProps {
  children: string;
  language: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SyntaxHighlighter = memo<ISyntaxHighlighterProps>(({ children, language, className, style }) => {
  const { darkMode } = useAppStore();
  const { data, isLoading } = useHighlight(children.trim(), language, darkMode);

  return (
    <>
      {isLoading ? (
        <div className={className} style={style}>
          <pre>
            <code>{children.trim()}</code>
          </pre>
        </div>
      ) : (
        <div
          className={cn('[&>pre]:!bg-transparent', className)}
          dangerouslySetInnerHTML={{
            __html: data as string,
          }}
          style={style}
        />
      )}
    </>
  );
});

SyntaxHighlighter.displayName = 'VinesSyntaxHighlighter';
