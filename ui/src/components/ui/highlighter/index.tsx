import React, { memo } from 'react';

import { SyntaxHighlighter } from '@/components/ui/highlighter/SyntaxHighlighter.tsx';
import { languageMap } from '@/components/ui/highlighter/useHighlight.ts';

interface IVinesHighlighterProps extends React.ComponentPropsWithoutRef<'pre'> {
  children: string;
  language: (typeof languageMap)[number];
}

export const VinesHighlighter = memo<IVinesHighlighterProps>(({ children, language, ...rest }) => {
  return (
    <SyntaxHighlighter language={language?.toLowerCase()} {...rest}>
      {children}
    </SyntaxHighlighter>
  );
});

VinesHighlighter.displayName = 'VinesHighlighter';
