import React from 'react';

import { NodeCustomEditor } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/header/node-custom-editor';
import { QuickOptions } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/header/quick-options.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';

interface IHeaderProps {
  node?: VinesNode;
}

export const Header: React.FC<IHeaderProps> = ({ node }) => {
  return (
    <header className="flex w-full items-center justify-between">
      <NodeCustomEditor node={node} />
      <QuickOptions nodeId={node?.id} />
    </header>
  );
};
