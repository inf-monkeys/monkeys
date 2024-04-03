import React, { memo, useEffect, useRef } from 'react';

import { useParams } from '@tanstack/react-router';

import { set } from 'lodash';

import { useGetWorkflow } from '@/apis/workflow';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';

interface IVinesViewWrapperProps {
  workflowId?: string;
  children?: React.ReactNode;
}

export const VinesViewWrapper: React.FC<IVinesViewWrapperProps> = memo(({ workflowId, children }) => {
  const { page } = usePageStore();
  const { setWorkflowId } = useFlowStore();
  const { setVisible } = useCanvasStore();

  const { workflowId: pageWorkflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
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
    workflowId && setWorkflowId(finalWorkflowId);
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

    vines.executionWorkflowDisableRestore = page?.type === 'process';

    if (!workflow?.workflowDef?.tasks?.length) {
      setVisible(false);
    }
  }, [workflow]);

  return children;
});

VinesViewWrapper.displayName = 'VinesViewWrapper';
