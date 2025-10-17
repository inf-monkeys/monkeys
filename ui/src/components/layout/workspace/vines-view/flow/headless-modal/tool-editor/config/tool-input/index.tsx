import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { ToolCredentialItem } from '@inf-monkeys/monkeys';
import equal from 'fast-deep-equal/es6';
import { get, isArray, set } from 'lodash';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { VinesInputCredentials } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-credentials';
import { VinesInputProperty } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import {
  calculateDisplayInputs,
  getPropertyValueFromTask,
} from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { Button } from '@/components/ui/button';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';
import { Separator } from '@/components/ui/separator.tsx';
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
    // 将顶层字段合入显隐判断，修复修改 evaluatorType/expression 等后界面不刷新的问题
    const visibilityValues = {
      ...inputParams,
      evaluatorType: get(task, 'evaluatorType'),
      expression: get(task, 'expression'),
      loopCondition: get(task, 'loopCondition'),
    } as Record<string, unknown>;
    const finalInputs = calculateDisplayInputs(input ?? [], visibilityValues);

    const isSpecialNode = ['DO_WHILE', 'SWITCH'].includes(task?.type ?? '');
    const isSwitchNode = (task?.type ?? '') === 'SWITCH';

    const taskRef = useRef<VinesTask | null>(null);
    const [branchTick, setBranchTick] = useState(0);
    useEffect(() => {
      const newTask = cloneDeep(task);
      if (!newTask) {
        toast.error(t('workspace.flow-view.vines.tools.parsing-error'));
        return;
      }
      taskRef.current = newTask;
      setBranchTick((n) => n + 1);
    }, [nodeId, task]);

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

    // 分支名列表（仅 SWITCH）
    const decisionNames = useMemo(
      () => Object.keys(get(taskRef.current || task || {}, 'decisionCases', {})),
      [refresh, task, branchTick],
    );

    return (
      <div className={cn('flex flex-col gap-global px-1 py-2', className)}>
        {isSwitchNode && (
          <div className="bg-dialog flex flex-col gap-2 rounded-md border border-gray-6/40 p-2">
            <div className="flex items-center justify-between">
              <div className="text-xxs font-medium text-muted-foreground">分支管理</div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  icon={<Plus className="h-3 w-3" />}
                  onClick={() => {
                    // 通过原生节点能力新增分支：增量命名 branchN
                    const vinesCore: any = (window as any)?.vinesCoreRef; // 兜底：但主要依赖 updateRaw 触发后的渲染
                    void vinesCore;
                    // 直接修改 taskRef.current 的 decisionCases 结构，按现有命名规则追加
                    const taskObj: any = taskRef.current;
                    if (!taskObj) return;
                    const cases = taskObj.decisionCases ?? {};
                    const names = Object.keys(cases);
                    let index = names.length + 1;
                    let name = `branch${index}`;
                    while (names.includes(name)) name = `branch${++index}`;
                    cases[name] = cases[name] || [
                      {
                        name: 'fake_node',
                        type: 'SIMPLE',
                        taskReferenceName: `fake_node_${Date.now()}`,
                        inputParameters: {},
                      },
                    ];
                    taskObj.decisionCases = { ...cases };
                    updateRaw?.(nodeId, taskObj, false);
                    forceUpdate();
                    setBranchTick((n) => n + 1);
                  }}
                >
                  新增分支
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                {decisionNames.map((name) => (
                  <div
                    key={name}
                    className="text-xxs group flex items-center gap-1 rounded-full border bg-background/50 px-2 py-0.5 hover:border-gray-8"
                  >
                    <span className="font-medium">{name}</span>
                    <SimpleInputDialog
                      title="重命名分支"
                      description="只能以字母开头，包含字母和数字"
                      initialValue={name}
                      onFinished={(newName) => {
                        const taskObj: any = taskRef.current;
                        if (!taskObj) return;
                        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(newName)) return;
                        const cases = { ...(taskObj.decisionCases ?? {}) } as Record<string, any>;
                        if (newName in cases) return;
                        cases[newName] = cases[name];
                        delete cases[name];
                        taskObj.decisionCases = cases as any;
                        updateRaw?.(nodeId, taskObj, false);
                        forceUpdate();
                        setBranchTick((n) => n + 1);
                      }}
                    >
                      <Button
                        size="xs"
                        variant="borderless"
                        className="opacity-60 group-hover:opacity-100"
                        icon={<Pencil className="h-3 w-3" />}
                      />
                    </SimpleInputDialog>
                    <Button
                      size="xs"
                      variant="borderless"
                      className="text-red-10 opacity-60 group-hover:opacity-100 [&_svg]:stroke-red-10"
                      icon={<Trash2 className="h-3 w-3" />}
                      onClick={() => {
                        const taskObj: any = taskRef.current;
                        if (!taskObj) return;
                        const cases = { ...(taskObj.decisionCases ?? {}) } as Record<string, unknown>;
                        if (Object.keys(cases).length <= 2) return; // 至少保留双分支
                        delete cases[name];
                        taskObj.decisionCases = cases as any;
                        updateRaw?.(nodeId, taskObj, false);
                        forceUpdate();
                        setBranchTick((n) => n + 1);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">默认分支：</span>
                <Button
                  size="xs"
                  variant="borderless"
                  className="opacity-80 hover:opacity-100"
                  icon={<Trash2 className="h-3 w-3" />}
                  onClick={() => {
                    const taskObj: any = taskRef.current;
                    if (!taskObj) return;
                    taskObj.defaultCase = [];
                    updateRaw?.(nodeId, taskObj, false);
                    forceUpdate();
                    setBranchTick((n) => n + 1);
                  }}
                >
                  清空默认
                </Button>
              </div>
            </div>
          </div>
        )}
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
