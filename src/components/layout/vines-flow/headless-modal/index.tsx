import React from 'react';

import { ContextMenu } from '@/components/layout/vines-flow/headless-modal/context-menu';
import { ToolEditor } from '@/components/layout/vines-flow/headless-modal/tool-editor';
import { ToolsSelector } from '@/components/layout/vines-flow/headless-modal/tools-selector';

interface IVinesHeadlessModalProps {}

export const VinesHeadlessModal: React.FC<IVinesHeadlessModalProps> = () => {
  return (
    <div className="pointer-events-none absolute size-full">
      <ContextMenu />
      <ToolsSelector />
      <ToolEditor />
    </div>
  );
};
