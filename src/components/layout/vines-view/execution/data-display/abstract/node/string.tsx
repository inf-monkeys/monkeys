import React from 'react';

import { JSONValue } from '@/components/ui/code-editor';

interface IVinesAbstractStringProps {
  children: JSONValue;
}

export const VinesAbstractString: React.FC<IVinesAbstractStringProps> = ({ children }) => {
  return (
    <div className="prose break-words text-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
      {children?.toString()}
    </div>
  );
};
