import React, { useEffect, useState } from 'react';

import { cloneDeep, omit, set } from 'lodash';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface INodeCustomEditorProps {
  node?: VinesNode;
}

export const NodeCustomEditor: React.FC<INodeCustomEditorProps> = ({ node }) => {
  const { vines } = useVinesFlow();

  const nodeId = node?.id ?? '';
  const task = node?.getRaw();
  const toolName = task?.name ?? '';

  const data = node?.customData;
  const tool = vines.getTool(toolName);

  const [customIcon, setCustomIcon] = useState<string>('');
  const [customDisplayName, setCustomDisplayName] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');

  useEffect(() => {
    if (!customIcon && !customDisplayName && !customDescription) {
      setCustomIcon(data?.icon ?? tool?.icon ?? 'emoji:⚠️:#35363b');
      setCustomDisplayName(data?.title ?? tool?.displayName ?? toolName);
      setCustomDescription(data?.description ?? tool?.description ?? '');
    }
  }, [data, tool]);

  const icon = tool?.icon ?? data?.icon ?? 'emoji:⚠️:#35363b';

  const handleUpdate = () => {
    const newTask = cloneDeep(task);
    if (!newTask) {
      toast.error('工具数据异常！');
      return;
    }
    customIcon !== icon ? set(newTask, '__alias.icon', customIcon) : omit(newTask, '__alias.icon');
    customDisplayName ? set(newTask, '__alias.title', customDisplayName) : omit(newTask, '__alias.title');
    customDescription ? set(newTask, '__alias.description', customDescription) : omit(newTask, '__alias.description');
    vines.updateRaw(nodeId, newTask);
  };

  return (
    <Tooltip>
      <Popover onOpenChange={(value) => !value && handleUpdate()}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <div className="flex cursor-pointer items-center gap-4 rounded-md p-2 transition-all hover:bg-gray-2 hover:shadow">
              <VinesIcon size="lg">{icon}</VinesIcon>
              <div className="flex flex-col gap-1 leading-5">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-2">
                    <p className="text-base font-bold leading-none">
                      {data?.title ?? tool?.displayName ?? toolName ?? '不受支持的工具'}
                    </p>
                    {data?.title && <span className="text-text2 text-xs font-light">{tool?.displayName}</span>}
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
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">自定义工具</h4>
              <p className="text-sm text-muted-foreground">设置工具显示信息</p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">工具别名</Label>
                <Input
                  id="width"
                  value={customDisplayName}
                  onChange={setCustomDisplayName}
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">工具描述</Label>
                <Input
                  id="width"
                  value={customDescription}
                  onChange={setCustomDescription}
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">工具图标</Label>
                <VinesIconEditor value={customIcon} defaultValue={icon} onChange={setCustomIcon} />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>点击编辑工具自定义信息</TooltipContent>
    </Tooltip>
  );
};
