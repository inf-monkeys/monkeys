import React, { useCallback, useEffect, useRef, useState } from 'react';

import { debounce, get, set } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { cloneDeep } from '@/utils';

interface INodeConfigProps {
  nodeId: string;
  task?: VinesTask;
}

export const ToolAdvancedConfig: React.FC<INodeConfigProps> = ({ nodeId, task }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const isWorkflowReadOnly = useCanvasStore((s) => s.isWorkflowReadOnly);

  const taskRef = useRef<VinesTask | null>(null);

  const handleUpdate = useCallback(
    debounce((key: string, value: unknown) => {
      if (!taskRef.current) {
        toast.error(t('workspace.flow-view.headless-modal.tool-editor.advanced-config.error'));
        return;
      }
      set(taskRef.current, `inputParameters.__advancedConfig.${key}`, value);
      vines.updateRaw(nodeId, taskRef.current, false);
    }, 300),
    [nodeId, vines],
  );

  const [outputAsSelect, setOutputAsSelect] = useState<string | undefined>();
  const [timeoutInput, setTimeoutInput] = useState<string | undefined>();

  useEffect(() => {
    const newTask = cloneDeep(task);
    if (!newTask) {
      toast.error(t('workspace.flow-view.headless-modal.tool-editor.advanced-config.parse-error'));
      return;
    }
    taskRef.current = newTask;

    setOutputAsSelect(get(taskRef.current, 'inputParameters.__advancedConfig.outputAs'));
    setTimeoutInput(get(taskRef.current, 'inputParameters.__advancedConfig.timeout'));
  }, [nodeId]);

  return (
    <main className="flex size-full flex-col gap-4 overflow-hidden px-4">
      <Label>{t('workspace.flow-view.headless-modal.tool-editor.advanced-config.timeout.label')}</Label>
      <Input
        placeholder={t('workspace.flow-view.headless-modal.tool-editor.advanced-config.timeout.placeholder')}
        type="number"
        value={timeoutInput}
        onChange={(val) => {
          const number = Number(val);
          if (isNaN(number)) {
            toast.error(t('workspace.flow-view.headless-modal.tool-editor.advanced-config.timeout.number-error'));
            return;
          }
          if (number < 0) {
            toast.error(t('workspace.flow-view.headless-modal.tool-editor.advanced-config.timeout.zero-error'));
            return;
          }
          setTimeoutInput(val);
          handleUpdate('timeout', number);
        }}
        disabled={isWorkflowReadOnly}
      />
      <Label>{t('workspace.flow-view.headless-modal.tool-editor.advanced-config.output.label')}</Label>
      <Select
        value={outputAsSelect}
        onValueChange={(val) => {
          setOutputAsSelect(val);
          handleUpdate('outputAs', val);
        }}
        defaultValue="json"
        disabled={isWorkflowReadOnly}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={t('workspace.flow-view.headless-modal.tool-editor.advanced-config.output.placeholder')}
          />
        </SelectTrigger>
        <SelectContent>
          {['json', 'stream'].map((it) => (
            <SelectItem value={it} key={it} className="cursor-pointer">
              {it}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="-mt-2 text-xs text-gray-10">
        {t('workspace.flow-view.headless-modal.tool-editor.advanced-config.output.tips')}
      </span>
    </main>
  );
};
