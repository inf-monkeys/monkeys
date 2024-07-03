import React, { useEffect, useState } from 'react';

import { get, isEmpty, omit, set } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { cloneDeep } from '@/utils';

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
  const { t } = useTranslation();

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
      toast.error(t('workspace.flow-view.vines.tools.error'));
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
        <h4 className="font-medium leading-none">
          {t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.title')}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.desc')}
        </p>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">
            {t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.form.name')}
          </Label>
          <Input id="width" value={customDisplayName} onChange={setCustomDisplayName} className="col-span-2 h-8" />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">
            {t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.form.desc')}
          </Label>
          <Input id="width" value={customDescription} onChange={setCustomDescription} className="col-span-2 h-8" />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">
            {t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.form.icon')}
          </Label>
          <VinesIconEditor value={customIcon} defaultValue={defaultIcon} onChange={setCustomIcon} />
        </div>
      </div>
      <Button onClick={handleUpdate} variant="outline">
        {t('workspace.flow-view.headless-modal.tool-editor.header.info.editor.form.submit')}
      </Button>
    </div>
  );
};
