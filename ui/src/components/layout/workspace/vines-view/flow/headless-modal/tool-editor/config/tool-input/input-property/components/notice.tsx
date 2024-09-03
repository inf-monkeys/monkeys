import React from 'react';

import remarkGfm from 'remark-gfm';

import { MemoizedReactMarkdown } from '@/components/ui/markdown';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

export const NoticeInput: React.FC<{ def: Pick<VinesToolDefProperties, 'displayName'> }> = ({ def }) => {
  return (
    <div className="col-span-2 mb-3 flex max-h-96 w-full overflow-y-auto rounded bg-slate-3 p-4">
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
        {getI18nContent(def.displayName)}
      </MemoizedReactMarkdown>
    </div>
  );
};
