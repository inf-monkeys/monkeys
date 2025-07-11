import React, { memo, useEffect, useRef, useState } from 'react';

import { ToolCredentialItem } from '@inf-monkeys/monkeys';
import equal from 'fast-deep-equal/es6';
import { get, isArray, set } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { VinesInputCredentials } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-credentials';
import { VinesInputProperty } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import {
  calculateDisplayInputs,
  getPropertyValueFromTask,
} from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesVariableMap, VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { VARIABLE_REGEXP } from '@/package/vines-flow/core/utils.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { cloneDeep, cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IToolInputProps {
  tool?: VinesToolDef;
  updateRaw?: (nodeId: string, task: VinesTask, update: boolean) => void;
  variableMapper: Record<string, IVinesVariableMap>;
  nodeId: string;
  task?: VinesTask;
  className?: string;
}

export const ToolInput: React.FC<IToolInputProps> = memo(
  ({ nodeId, task, tool, updateRaw, variableMapper, className }) => {
    const { t } = useTranslation();

    const isWorkflowReadOnly = useCanvasStore((s) => s.isWorkflowReadOnly);

    const input = tool?.input;

    const inputParams = get(task, 'inputParameters', {});
    const finalInputs = calculateDisplayInputs(input ?? [], inputParams);

    const isSpecialNode = ['DO_WHILE', 'SWITCH'].includes(task?.type ?? '');

    const taskRef = useRef<VinesTask | null>(null);
    useEffect(() => {
      const newTask = cloneDeep(task);
      if (!newTask) {
        toast.error(t('workspace.flow-view.vines.tools.parsing-error'));
        return;
      }
      taskRef.current = newTask;
    }, [nodeId]);

    const forceUpdate = useForceUpdate();
    const handleUpdate = (value: unknown, name: string, needForceUpdate = true) => {
      if (!taskRef.current) {
        toast.error(t('workspace.flow-view.vines.tools.error'));
        return;
      }

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

      if (['loopCondition', 'evaluatorType', 'expression'].includes(name)) {
        set(taskRef.current, name, value);
      } else {
        set(taskRef.current, `inputParameters.${name}`, value);
      }

      updateRaw?.(nodeId, taskRef.current, false);
      needForceUpdate && forceUpdate();
    };

    // 计算显隐更新时自动填充默认值
    const [refresh, setRefresh] = useState(false);
    const calculateInputsRef = useRef<VinesToolDefProperties[] | null>(null);
    useEffect(() => {
      const needMemoInputs = !equal(finalInputs, calculateInputsRef.current);

      calculateInputsRef.current = finalInputs;
      if (needMemoInputs) {
        let needRefresh = false;
        finalInputs?.forEach((def) => {
          const { name, typeOptions, default: defaultValue } = def;
          if (defaultValue !== void 0 && get(task, `inputParameters.${name}`) === void 0) {
            if (typeOptions?.multipleValues) {
              handleUpdate(isArray(defaultValue) ? defaultValue : [defaultValue], name, false);
            } else {
              handleUpdate(defaultValue, name, false);
            }
            needRefresh = true;
          }
        });
        if (needRefresh) {
          setRefresh(true);
          setTimeout(() => setRefresh(false), 16);
        }
      }
    }, [finalInputs]);

    const credentials = get(tool, 'credentials', []) as ToolCredentialItem[];

    return (
      <div className={cn('flex flex-col gap-global px-1 py-2', className)}>
        {credentials?.length ? (
          <VinesInputCredentials
            credentials={credentials}
            value={get(task, 'inputParameters.credential.id', '')}
            onChange={(type, id) => handleUpdate({ type, id }, 'credential')}
          />
        ) : null}
        {!refresh &&
          finalInputs?.map((def, index) => (
            <VinesInputProperty
              refresh={refresh}
              key={def.name + index}
              def={def}
              nodeId={nodeId}
              value={getPropertyValueFromTask(def, task, !isSpecialNode)}
              onChange={(value: unknown) => handleUpdate(value, def.name)}
              variableMapper={variableMapper}
              disabled={isWorkflowReadOnly}
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
