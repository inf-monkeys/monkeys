import React from 'react';

import { NodeCustomEditor } from '@/components/layout/vines-flow/headless-modal/tool-editor/header/node-custom-editor.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';

interface IHeaderProps {
  node?: VinesNode;
}

export const Header: React.FC<IHeaderProps> = ({ node }) => {
  return (
    <header className="flex w-full justify-between">
      <NodeCustomEditor node={node} />
    </header>
  );
};
