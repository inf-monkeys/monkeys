import React, { useEffect, useState } from 'react';

import { cloneDeep, get, isEmpty, omit, set } from 'lodash';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';

interface IToolCustomDataEditorProps {
  task?: VinesTask;
  icon?: string;
  defaultIcon?: string;
  name?: string;
  defaultName?: string;
  desc?: string;
  defaultDesc?: string;
  updateRaw: (task: VinesTask) => void;
}

// million-ignore
export const ToolCustomDataEditor: React.FC<IToolCustomDataEditorProps> = ({
  task,
  icon,
  defaultIcon,
  name,
  defaultName,
  desc,
  defaultDesc,
  updateRaw,
}) => {
  const [customIcon, setCustomIcon] = useState<string>('');
  const [customDisplayName, setCustomDisplayName] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');

  useEffect(() => {
    if (!customIcon && !customDisplayName && !customDescription) {
      setCustomIcon(icon ?? '');
      setCustomDisplayName(name ?? '');
      setCustomDescription(desc ?? '');
    }
  }, [icon, name, desc]);

  const handleUpdate = () => {
    let newTask = cloneDeep(task);
    if (!newTask) {
      toast.error('工具数据异常！');
      return;
    }

    if (customIcon && customIcon !== defaultIcon) {
      set(newTask, '__alias.icon', customIcon);
    } else {
      newTask = omit(newTask, '__alias.icon') as VinesTask;
    }
    if (customDisplayName && customDisplayName !== defaultName) {
      set(newTask, '__alias.title', customDisplayName);
    } else {
      newTask = omit(newTask, '__alias.title') as VinesTask;
    }
    if (customDescription && customDescription !== defaultDesc) {
      set(newTask, '__alias.description', customDescription);
    } else {
      newTask = omit(newTask, '__alias.description') as VinesTask;
    }

    if (isEmpty(get(newTask, '__alias'))) {
      newTask = omit(newTask, '__alias') as VinesTask;
    }

    updateRaw(newTask);
  };

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">自定义工具</h4>
        <p className="text-sm text-muted-foreground">设置工具显示信息</p>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">工具别名</Label>
          <Input id="width" value={customDisplayName} onChange={setCustomDisplayName} className="col-span-2 h-8" />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">工具描述</Label>
          <Input id="width" value={customDescription} onChange={setCustomDescription} className="col-span-2 h-8" />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">工具图标</Label>
          <VinesIconEditor value={customIcon} defaultValue={defaultIcon} onChange={setCustomIcon} />
        </div>
      </div>
      <Button onClick={handleUpdate} variant="outline">
        保存
      </Button>
    </div>
  );
};
