import React from 'react';

import remarkGfm from 'remark-gfm';

import { MemoizedReactMarkdown } from '@/components/ui/markdown';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const NoticeInput: React.FC<{ def: Pick<VinesToolDefProperties, 'displayName'> }> = ({ def }) => {
  return (
    <div className="mb-3 flex max-h-96 overflow-y-auto rounded bg-slate-3 p-4 shadow-sm">
      <MemoizedReactMarkdown
        className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
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
