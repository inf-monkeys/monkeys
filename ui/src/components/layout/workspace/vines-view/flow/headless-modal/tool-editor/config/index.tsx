import React from 'react';

import { useTranslation } from 'react-i18next';

import { ToolInput } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input';
import { ToolOutput } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-output';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface INodeConfigProps {
  nodeId: string;
  task?: VinesTask;
}

export const ToolConfig: React.FC<INodeConfigProps> = ({ nodeId, task }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const toolName = task?.name ?? '';

  const tool = vines.getTool(toolName);

  const isEmptyOutput = !tool?.output?.length;
  const isEmpty = !tool || (!tool?.input?.length && isEmptyOutput);

  const variableMapper = Object.fromEntries(vines.variablesMapper.entries());

  return (
    <main className="flex size-full overflow-hidden">
      {isEmpty ? (
        <div className="vines-center size-full">
          <h1 className="text-base font-bold">{t('workspace.flow-view.headless-modal.tool-editor.input.empty')}</h1>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={50} maxSize={85} className="flex flex-1 flex-col gap-2 overflow-y-auto pl-4 pr-2">
            <h1 className="text-base font-bold">{t('workspace.flow-view.headless-modal.tool-editor.input.title')}</h1>
            <ScrollArea className="h-[calc(100%-1.5rem)] pr-2">
              <ToolInput
                nodeId={nodeId}
                task={task}
                tool={tool}
                updateRaw={(nodeId: string, task: VinesTask, update: boolean) => vines.updateRaw(nodeId, task, update)}
                variableMapper={variableMapper}
              />
            </ScrollArea>
          </ResizablePanel>
          {isEmptyOutput ? null : (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} className="flex flex-1 flex-col overflow-y-auto px-4">
                <h1 className="line-clamp-1 text-base font-bold">
                  {t('workspace.flow-view.headless-modal.tool-editor.output.title')}
                </h1>
                <div className="h-[calc(100%-1.5rem)]">
                  <ToolOutput nodeId={nodeId} />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      )}
    </main>
  );
};
