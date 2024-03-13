import React from 'react';

import data from '@emoji-mart/data';
import { cloneDeep, get, set } from 'lodash';
import { toast } from 'sonner';

import { VinesInputProperty } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import {
  calculateDisplayInputs,
  getPropertyValueFromTask,
} from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { VARIABLE_REGEXP } from '@/package/vines-flow/core/utils.ts';

interface IToolInputProps {
  tool?: VinesToolDef;
  node?: VinesNode;
}

export const ToolInput: React.FC<IToolInputProps> = ({ tool, node }) => {
  const { vines } = useVinesFlow();

  const workflowVersion = vines.version ?? 1;
  const nodeId = node?.id ?? '';
  const task = node?.getRaw();
  const input = vines?.getTool(task?.name ?? '')?.input;

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
          value = Number(data);
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

    vines.updateRaw(nodeId, newTask, false);
  };

  return (
    <div className="flex flex-col gap-4 px-1">
      {finalInputs?.map((def, index) => (
        <VinesInputProperty
          key={index}
          def={def}
          nodeId={nodeId}
          workflowVersion={workflowVersion}
          value={getPropertyValueFromTask(def, task, !isSpecialNode)}
          onChange={(value: unknown) => handleUpdate(value, def)}
        />
      ))}
    </div>
  );
};
