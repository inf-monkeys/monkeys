import { useCallback, useEffect, useRef } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { createWorkflow as createWorkflowFromAPI } from '@/apis/workflow';
import { useVinesRefresher } from '@/package/vines-flow';
import { VINES_CANVAS_PADDING } from '@/package/vines-flow/core/consts.ts';
import { TaskType, WorkflowDef } from '@/package/vines-flow/share/types.ts';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';

export const useVinesFlow = () => {
  const { _refresher, _vines } = useVinesRefresher();

  const calculateAdaptiveZoom = (containerWidth: number, containerHeight: number): number => {
    const {
      canvasSize: { width, height },
    } = _vines;

    const vinesNodeLength = _vines.getAllNodes().length;
    if (!vinesNodeLength) return 0;

    const useHorizontal = _vines.renderDirection === 'horizontal';
    const padding =
      (useHorizontal ? 30 : 0) + VINES_CANVAS_PADDING + Math.max((6 - vinesNodeLength) * VINES_CANVAS_PADDING, 0);

    // 计算画布和容器的宽高比
    const ratioWidth = containerWidth / (width + 2 * padding);
    const ratioHeight = containerHeight / (height + 2 * padding);

    // 返回较小的比例，以确保画布能够完全适应容器
    return Math.min(ratioWidth, ratioHeight);
  };

  return {
    vines: _vines,
    vinesTools: _vines.tools,

    vinesCanvasSize: _vines.canvasSize,

    calculateAdaptiveZoom,

    VINES_REFRESHER: _refresher,
  };
};

export const useWorkflow = (workflow?: { workflowId?: string }) => {
  const workflowRef = useRef<{ id?: string }>({});

  useEffect(() => {
    workflow?.workflowId && (workflowRef.current.id = workflow.workflowId);
  }, [workflow]);

  const createWorkflow = useCallback(
    async (
      info: Partial<Pick<MonkeyWorkflow, 'displayName' | 'iconUrl' | 'description'>>,
      workflowDef?: Omit<WorkflowDef, 'version' | 'name' | 'inputParameters' | 'timeoutSeconds'>,
      subWorkflowMasterId?: string,
    ) => {
      if (!workflowDef) {
        workflowDef = {
          tasks: [
            {
              name: 'fake_node',
              taskReferenceName: `fake_node_${Math.random().toString(36).slice(-8)}`,
              type: 'SIMPLE' as TaskType.SIMPLE,
            },
          ],
        };
      }
      const newWorkflow: Partial<
        Pick<
          MonkeyWorkflow,
          'displayName' | 'variables' | 'description' | 'iconUrl' | 'tasks' | 'hidden' | 'masterWorkflowId'
        >
      > = {
        displayName: info.displayName,
        description: info.description ?? '',
        iconUrl: info.iconUrl ?? DEFAULT_WORKFLOW_ICON_URL,
        tasks: workflowDef.tasks,
      };

      if (subWorkflowMasterId) {
        newWorkflow.hidden = true;
        newWorkflow.masterWorkflowId = subWorkflowMasterId === 'current' ? workflowRef.current.id : subWorkflowMasterId;
      }

      return (await createWorkflowFromAPI(newWorkflow))?.workflowId;
    },
    [],
  );

  return { createWorkflow };
};
