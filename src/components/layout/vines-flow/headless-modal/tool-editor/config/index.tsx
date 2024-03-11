import React from 'react';

import { Index } from 'src/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input';

import { ToolOutput } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-output';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface INodeConfigProps {
  node?: VinesNode;
}

export const ToolConfig: React.FC<INodeConfigProps> = ({ node }) => {
  const { vines } = useVinesFlow();

  const task = node?.getRaw();
  const toolName = task?.name ?? '';

  const tool = vines.getTool(toolName);

  const isEmpty = !tool || (!tool?.input?.length && !tool?.output?.length);

  return (
    <main className="flex size-full overflow-clip">
      {isEmpty ? (
        <div className="vines-center size-full">
          <h1 className="text-base font-bold">暂无配置参数</h1>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={50} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <h1 className="text-base font-bold">输入</h1>
            <Index node={node} tool={tool} updateRaw={vines.updateRaw} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={40}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 [&_*]:line-clamp-1"
          >
            <h1 className="text-base font-bold">输出</h1>
            <ToolOutput />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  );
};
