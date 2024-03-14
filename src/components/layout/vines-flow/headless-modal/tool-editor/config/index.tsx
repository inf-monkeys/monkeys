import React from 'react';

import { ToolInput } from 'src/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input';

import { ToolOutput } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-output';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface INodeConfigProps {
  node?: VinesNode;
}

export const ToolConfig: React.FC<INodeConfigProps> = ({ node }) => {
  const { vines } = useVinesFlow();

  const workflowVersion = vines.version ?? 1;
  const task = node?.getRaw();
  const toolName = task?.name ?? '';

  const tool = vines.getTool(toolName);

  const isEmpty = !tool || (!tool?.input?.length && !tool?.output?.length);

  const variableMapper = Object.fromEntries(vines.variablesMapper.entries());

  return (
    <main className="flex size-full overflow-clip">
      {isEmpty ? (
        <div className="vines-center size-full">
          <h1 className="text-base font-bold">暂无配置参数</h1>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={50} className="flex flex-1 flex-col gap-2 overflow-y-auto pl-4 pr-2">
            <h1 className="text-base font-bold">输入</h1>
            <ScrollArea className="h-[calc(100%-1.5rem)] pr-2">
              <ToolInput
                node={node}
                tool={tool}
                workflowVersion={workflowVersion}
                updateRaw={(nodeId: string, task: VinesTask, update: boolean) => vines.updateRaw(nodeId, task, update)}
                variableMapper={variableMapper}
              />
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
