import React from 'react';

import { JSONValue } from '@/components/ui/code-editor';
import { VinesMarkdown } from '@/components/ui/markdown';

interface IVinesAbstractStringProps {
  children: JSONValue;
}

export const VinesAbstractString: React.FC<IVinesAbstractStringProps> = ({ children }) => {
  return <VinesMarkdown className="max-w-full">{children?.toString()}</VinesMarkdown>;
};
