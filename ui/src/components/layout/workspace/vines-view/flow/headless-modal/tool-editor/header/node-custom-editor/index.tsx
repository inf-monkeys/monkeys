import React, { useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ToolCustomDataEditor } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/header/node-custom-editor/editor.tsx';
import { FloatingPopover, FloatingPopoverContent, FloatingPopoverTrigger } from '@/components/ui/floating-popover';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);

  const { vines } = useVinesFlow();

  const nodeId = node?.id ?? '';
  const task = node?.getRaw();
  const toolName = task?.name ?? '';

  const data = node?.customData;
  const tool = vines.getTool(toolName);

  const icon = data?.icon ?? tool?.icon ?? 'emoji:⚠️:#35363b';
  const toolDisplayName = data?.title ?? tool?.displayName ?? toolName;

  // 当弹层打开时，将焦点移动到第一个可聚焦元素，避免焦点丢失导致关闭
  useEffect(() => {
    if (!open || !contentRef.current) return;
    const focusable = contentRef.current.querySelector<HTMLElement>(
      'input, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      requestAnimationFrame(() => focusable.focus());
    }
  }, [open]);

  return (
    <FloatingPopover open={open} onOpenChange={setOpen} placement="bottom-start">
      <FloatingPopoverTrigger asChild>
        <div
          className="flex cursor-pointer items-center gap-global rounded-md p-2 transition-all hover:bg-gray-2 hover:shadow"
          onClick={(e) => {
            e.stopPropagation();
          }}
          title={t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.button')}
        >
          <VinesIcon size="lg" disabledPreview>
            {icon}
          </VinesIcon>
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
      </FloatingPopoverTrigger>
      <FloatingPopoverContent
        ref={contentRef}
        className="w-[480px] max-w-[calc(100vw-32px)]"
        role="dialog"
        aria-label={t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.button')}
        portal={false}
      >
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
      </FloatingPopoverContent>
    </FloatingPopover>
  );
};
