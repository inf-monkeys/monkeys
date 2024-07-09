import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useParams } from '@tanstack/react-router';

import { set } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useGetWorkflow } from '@/apis/workflow';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { useLocalStorage } from '@/utils';
import { useRetimer } from '@/utils/use-retimer.ts';

interface IVinesViewWrapperProps {
  workflowId?: string;
  children?: React.ReactNode;
}

export const VinesViewWrapper: React.FC<IVinesViewWrapperProps> = memo(({ workflowId, children }) => {
  const { t } = useTranslation();

  const { page } = usePageStore();
  const { setWorkflowId } = useFlowStore();
  const { setVisible } = useCanvasStore();

  const { workflowId: pageWorkflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });

  const finalWorkflowId = pageWorkflowId ?? workflowId ?? '';

  const [isWorkflowId, setIsWorkflowId] = useState<string>(finalWorkflowId);
  const [token] = useLocalStorage<string>('vines-token', '', false);

  const { vines } = useVinesFlow();

  const initialWorkflowVersionRef = useRef<number>();
  const vinesVersion = vines.version;
  const finalVersion =
    initialWorkflowVersionRef.current && vinesVersion && initialWorkflowVersionRef.current !== vinesVersion
      ? vinesVersion
      : void 0;
  const { data: workflow } = useGetWorkflow(isWorkflowId, finalVersion);

  const reTimer = useRetimer();
  const refreshRef = useRef(false);
  const handleRefresh = useCallback(
    (newToken: string) =>
      reTimer(
        setTimeout(() => {
          if (!newToken) {
            setIsWorkflowId('');
            refreshRef.current = true;
          } else if (refreshRef.current) {
            setIsWorkflowId(finalWorkflowId);
            refreshRef.current = false;
          }
        }, 500) as unknown as number,
      ),
    [reTimer, token, finalWorkflowId],
  );
  useEffect(() => {
    handleRefresh(token);
  }, [token]);

  useEffect(() => {
    workflowId && setWorkflowId(isWorkflowId);
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

    if (!workflow?.tasks?.length && workflow !== void 0) {
      setVisible(false);
    }
  }, [workflow]);

  return children;
});

VinesViewWrapper.displayName = 'VinesViewWrapper';
