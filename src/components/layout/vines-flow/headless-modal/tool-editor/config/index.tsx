import React from 'react';

import { ToolInput } from 'src/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input';

import { ToolOutput } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-output';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface INodeConfigProps {
  node?: VinesNode;
  forceUpdate?: () => void;
}

export const ToolConfig: React.FC<INodeConfigProps> = ({ node, forceUpdate }) => {
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
          <ResizablePanel minSize={50} className="flex flex-1 flex-col gap-4 overflow-y-auto pl-4 pr-2">
            <h1 className="text-base font-bold">输入</h1>
            <ScrollArea className="h-[calc(100%-1.5rem)] pr-2">
              <ToolInput node={node} tool={tool} />
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} className="flex flex-1 flex-col overflow-y-auto px-4">
            <h1 className="line-clamp-1 text-base font-bold">输出</h1>
            <div className="h-[calc(100%-1.5rem)]">
              <ToolOutput nodeId={node?.id} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  );
};
