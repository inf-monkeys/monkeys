import React from 'react';

import { useTranslation } from 'react-i18next';

import { ToolCustomDataEditor } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/header/node-custom-editor/editor.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { getI18nContent } from '@/utils';

interface INodeCustomEditorProps {
  node?: VinesNode;
}

export const NodeCustomEditor: React.FC<INodeCustomEditorProps> = ({ node }) => {
  const { t } = useTranslation();

  const { isLatestWorkflowVersion } = useFlowStore();
  const { vines } = useVinesFlow();

  const nodeId = node?.id ?? '';
  const task = node?.getRaw();
  const toolName = task?.name ?? '';

  const data = node?.customData;
  const tool = vines.getTool(toolName);

  const icon = data?.icon ?? tool?.icon ?? 'emoji:⚠️:#35363b';
  const toolDisplayName = data?.title ?? tool?.displayName ?? toolName;

  return (
    <Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <div className="flex cursor-pointer items-center gap-4 rounded-md p-2 transition-all hover:bg-gray-2 hover:shadow">
              <VinesIcon size="lg">{icon}</VinesIcon>
              <div className="flex flex-col gap-1 leading-5">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-2">
                    <p className="text-base font-bold leading-none">
                      {getI18nContent(toolDisplayName) ?? t('workspace.flow-view.vines.tools.unknown')}
                    </p>
                    {data?.title && (
                      <span className="text-text2 text-xs font-light">{getI18nContent(tool?.displayName)}</span>
                    )}
                  </div>
                </div>
                <div className="!text-xs font-normal opacity-50">
                  {data?.description && `${data.description} / `}ID: {task?.taskReferenceName}
                </div>
              </div>
            </div>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent>
          <ToolCustomDataEditor
            icon={icon}
            defaultIcon={tool?.icon}
            name={getI18nContent(toolDisplayName)}
            defaultName={getI18nContent(tool?.displayName) ?? ''}
            desc={data?.description ?? ''}
            defaultDesc={data?.description ?? ''}
            task={task}
            updateRaw={(newTask) => isLatestWorkflowVersion && vines.updateRaw(nodeId, newTask)}
          />
        </PopoverContent>
      </Popover>
      <TooltipContent>{t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.button')}</TooltipContent>
    </Tooltip>
  );
};
