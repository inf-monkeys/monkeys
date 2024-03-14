import React from 'react';

import remarkGfm from 'remark-gfm';

import { IVinesInputPropertyProps } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import { MemoizedReactMarkdown } from '@/components/ui/markdown.tsx';

export const NoticeInput: React.FC<IVinesInputPropertyProps> = ({ def }) => {
  return (
    <div className="mb-3 flex max-h-96 overflow-y-auto rounded bg-slate-3 p-4 shadow-sm">
      <MemoizedReactMarkdown
        className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words"
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a target="_blank" rel="noopener noreferrer" href={href}>
              {children}
            </a>
          ),
        }}
      >
        {def.displayName}
      </MemoizedReactMarkdown>
    </div>
  );
};
