import { useCallback, useEffect, useRef } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { TaskType, WorkflowDef } from '@io-orkes/conductor-javascript';

import { createWorkflow as createWorkflowFromAPI } from '@/apis/workflow';
import { useVinesRefresher } from '@/package/vines-flow';
import { VINES_DEF_NODE } from '@/package/vines-flow/core/consts.ts';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';

export const useVinesFlow = () => {
  const { _refresher, _vines } = useVinesRefresher();

  const calculateAdaptiveZoom = (containerWidth: number, containerHeight: number): number => {
    const {
      canvasSize: { width, height },
    } = _vines;
    const vinesNodeLength = _vines.getAllNodes().length;
    if (!vinesNodeLength) return 0;

    const useHorizontal = _vines.renderDirection === 'horizontal';
    const vinesRenderType = _vines.renderOptions.type;

    const { padding: canvasPadding } = VINES_DEF_NODE[vinesRenderType];

    const padding = useHorizontal
      ? containerWidth / canvasPadding.horizontal
      : containerHeight / canvasPadding.vertical;

    const containerSize = useHorizontal ? containerWidth : containerHeight;
    const canvasSize = useHorizontal ? width : height;

    if (vinesRenderType !== IVinesFlowRenderType.COMPLICATE) {
      const zoomRatio = (containerSize - padding - Math.max((6 - vinesNodeLength) * padding, 0)) / canvasSize;
      if (!Number.isNaN(zoomRatio)) {
        return zoomRatio;
      }
    }

    return (containerSize - padding) / canvasSize;
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
        iconUrl: info.iconUrl ?? 'emoji:🍀:#ceefc5',
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
