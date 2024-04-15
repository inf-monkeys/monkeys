import React, { useCallback, useEffect, useRef, useState } from 'react';

import { debounce, get, set } from 'lodash';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { cloneDeep } from '@/utils';

interface INodeConfigProps {
  nodeId: string;
  task?: VinesTask;
}

export const ToolAdvancedConfig: React.FC<INodeConfigProps> = ({ nodeId, task }) => {
  const { vines } = useVinesFlow();

  const taskRef = useRef<VinesTask | null>(null);

  const handleUpdate = useCallback(
    debounce((key: string, value: unknown) => {
      if (!taskRef.current) {
        toast.error('工具数据异常！');
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
      toast.error('工具数据解析失败！');
      return;
    }
    taskRef.current = newTask;

    setOutputAsSelect(get(taskRef.current, 'inputParameters.__advancedConfig.outputAs'));
    setTimeoutInput(get(taskRef.current, 'inputParameters.__advancedConfig.timeout'));
  }, [nodeId]);

  return (
    <main className="flex size-full flex-col gap-4 overflow-clip px-4">
      <Label>输出模式</Label>
      <Select
        value={outputAsSelect}
        onValueChange={(val) => {
          setOutputAsSelect(val);
          handleUpdate('outputAs', val);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="请选择一个输出模式" />
        </SelectTrigger>
        <SelectContent>
          {['json', 'stream'].map((it) => (
            <SelectItem value={it} key={it} className="cursor-pointer">
              {it}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label>超时时间（秒）</Label>
      <Input
        placeholder="请输入超时时间（秒）"
        type="number"
        value={timeoutInput}
        onChange={(val) => {
          const number = Number(val);
          if (isNaN(number)) {
            toast.error('请输入数字');
            return;
          }
          if (number < 0) {
            toast.error('请输入大于等于 0 的数字');
            return;
          }
          setTimeoutInput(val);
          handleUpdate('timeout', number);
        }}
      />
    </main>
  );
};
