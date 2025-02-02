import React, { memo, useEffect, useRef } from 'react';

import { useParams } from '@tanstack/react-router';

import { set } from 'lodash';

import { useGetWorkflow } from '@/apis/workflow';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';

interface IVinesViewWrapperProps {
  workflowId?: string;
  children?: React.ReactNode;
}

export const VinesViewWrapper: React.FC<IVinesViewWrapperProps> = memo(({ workflowId, children }) => {
  const page = usePageStore((s) => s.page);
  const setWorkflowId = useFlowStore((s) => s.setWorkflowId);
  const setVisible = useCanvasStore((s) => s.setVisible);
  const setCanvasMode = useCanvasStore((s) => s.setCanvasMode);

  const { workflowId: pageWorkflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const finalWorkflowId = pageWorkflowId ?? workflowId ?? '';

  const { vines } = useVinesFlow();

  const initialWorkflowVersionRef = useRef<number>();
  const vinesVersion = vines.version;
  const finalVersion =
    initialWorkflowVersionRef.current && vinesVersion && initialWorkflowVersionRef.current !== vinesVersion
      ? vinesVersion
      : void 0;
  const { data: workflow } = useGetWorkflow(finalWorkflowId, finalVersion);

  useEffect(() => {
    finalWorkflowId && setWorkflowId(finalWorkflowId);
    if (workflow) {
      const initialWorkflowVersion = initialWorkflowVersionRef.current;
      const workflowVersion = workflow.version;
      if (!initialWorkflowVersion || initialWorkflowVersion < vinesVersion) {
        initialWorkflowVersionRef.current = workflowVersion;
      }

      if (workflowVersion < vinesVersion) {
        set(workflow, 'version', vinesVersion);
      }

      if (workflowVersion !== vinesVersion && initialWorkflowVersion) {
        setVisible(false);
        setTimeout(() => {
          vines.update({ workflow });
          setTimeout(() => setVisible(true), 80);
        }, 164);
      } else {
        vines.update({ workflow });
      }
    }

    if (page?.type === 'process') {
      vines.executionWorkflowDisableRestore = true;
      vines.restoreSubWorkflowChildren();
    } else {
      vines.executionWorkflowDisableRestore = false;
    }

    // 快捷方式时只读
    setCanvasMode(workflow?.shortcutsFlow ? CanvasStatus.READONLY : CanvasStatus.EDIT);

    if (!workflow?.tasks?.length && workflow !== void 0) {
      setVisible(false);
    }
  }, [workflow]);

  return children;
});

VinesViewWrapper.displayName = 'VinesViewWrapper';
