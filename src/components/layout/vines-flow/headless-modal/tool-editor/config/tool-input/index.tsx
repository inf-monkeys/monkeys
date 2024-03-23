import React, { memo } from 'react';

import { cloneDeep, get, set } from 'lodash';
import { toast } from 'sonner';

import { VinesInputProperty } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import {
  calculateDisplayInputs,
  getPropertyValueFromTask,
} from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesVariableMap, VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { VARIABLE_REGEXP } from '@/package/vines-flow/core/utils.ts';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IToolInputProps {
  tool?: VinesToolDef;
  updateRaw?: (nodeId: string, task: VinesTask, update: boolean) => void;
  workflowVersion?: number;
  variableMapper: Record<string, IVinesVariableMap>;
  nodeId: string;
  task?: VinesTask;
  className?: string;
}

export const ToolInput: React.FC<IToolInputProps> = memo(
  ({ nodeId, task, tool, updateRaw, variableMapper, workflowVersion = 1, className }) => {
    const input = tool?.input;

    const inputParams = get(task, 'inputParameters', {});
    const finalInputs = calculateDisplayInputs(input ?? [], inputParams);

    const isSpecialNode = ['DO_WHILE', 'SWITCH'].includes(task?.type ?? '');

    const handleUpdate = (value: unknown, def: VinesToolDefProperties) => {
      const { name } = def;
      const keyDef = input?.find((it) => it.name === name);
      if (keyDef) {
        const keyType = keyDef.type;
        if (keyType === 'number') {
          if (!isNaN(Number(value)) && !VARIABLE_REGEXP.test(value as string)) {
            value = Number(value);
          }
        } else if (['jsonObject', 'nestedJsonObject', 'nestedArray'].includes(keyType)) {
          try {
            value = JSON.parse(value as string);
          } catch (error) {
            /* empty */
          }
        }
      }

      const newTask = cloneDeep(task);
      if (!newTask) {
        toast.error('工具数据异常！');
        return;
      }

      if (['loopCondition', 'evaluatorType', 'expression'].includes(name)) {
        set(newTask, name, value);
      } else {
        set(newTask, `inputParameters.${name}`, value);
      }

      updateRaw?.(nodeId, newTask, false);
    };

    return (
      <div className={cn('flex flex-col gap-4 px-1 py-2', className)}>
        {finalInputs?.map((def, index) => (
          <VinesInputProperty
            key={def.name + index}
            def={def}
            nodeId={nodeId}
            workflowVersion={workflowVersion}
            value={getPropertyValueFromTask(def, task, !isSpecialNode)}
            onChange={(value: unknown) => handleUpdate(value, def)}
            variableMapper={variableMapper}
          />
        ))}
      </div>
    );
  },
  ({ updateRaw: _prevUpdateRaw, ...prevProps }, { updateRaw: _nextUpdateRaw, ...nextProps }) => {
    return stringify(prevProps) === stringify(nextProps);
  },
);

ToolInput.displayName = 'ToolInput';
