import React from 'react';

import { ContextMenu } from '@/components/layout/workspace/vines-view/flow/headless-modal/context-menu';
import { EndTool } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/end-tool';
import { StartTool } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool';
import { ToolEditor } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor';
import { ToolsSelector } from '@/components/layout/workspace/vines-view/flow/headless-modal/tools-selector';
import { VinesVariableSelector } from '@/components/layout/workspace/vines-view/flow/headless-modal/variable-selector';
import { WorkflowRawDataEditor } from '@/components/layout/workspace/vines-view/flow/headless-modal/workflow-raw-data-editor';

interface IVinesHeadlessModalProps {}

export const VinesHeadlessModal: React.FC<IVinesHeadlessModalProps> = () => {
  return (
    <div className="pointer-events-none absolute size-full">
      <ContextMenu />
      <ToolsSelector />
      <ToolEditor />
      <WorkflowRawDataEditor />
      <StartTool />
      <EndTool />
      <VinesVariableSelector />
    </div>
  );
};
