import React, { memo } from 'react';

import { useHighlight } from '@/components/ui/highlighter/useHighlight.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';

interface ISyntaxHighlighterProps {
  children: string;
  language: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SyntaxHighlighter = memo<ISyntaxHighlighterProps>(({ children, language, className, style }) => {
  const darkMode = useAppStore((s) => s.darkMode);
  const safeChildren = typeof children === 'string' ? children : String(children || '');
  const { data, isLoading } = useHighlight(safeChildren.trim(), language, darkMode);

  return (
    <>
      {isLoading ? (
        <div className={className} style={style}>
          <pre>
            <code>{safeChildren.trim()}</code>
          </pre>
        </div>
      ) : (
        <ScrollArea orientation="horizontal">
          <div
            className={cn('[&>pre]:!bg-transparent', className)}
            dangerouslySetInnerHTML={{
              __html: data as string,
            }}
            style={style}
          />
        </ScrollArea>
      )}
    </>
  );
});

SyntaxHighlighter.displayName = 'VinesSyntaxHighlighter';
