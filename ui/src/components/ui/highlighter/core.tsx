import React, { memo } from 'react';

import { IVinesHighlighterProps } from '@/components/ui/highlighter/index.tsx';
import { SyntaxHighlighter } from '@/components/ui/highlighter/SyntaxHighlighter.tsx';

const VinesHighlighter = memo<IVinesHighlighterProps>(({ children, language, ...rest }) => {
  return (
    <SyntaxHighlighter language={language?.toLowerCase()} {...rest}>
      {children}
    </SyntaxHighlighter>
  );
});

VinesHighlighter.displayName = 'VinesHighlighter';

export default VinesHighlighter;
