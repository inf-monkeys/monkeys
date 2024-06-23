import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useHotkeys } from '@mantine/hooks';
import equal from 'fast-deep-equal/es6';
import { pick } from 'lodash';
import { GitCommitHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useWorkflowValidation } from '@/apis/workflow/validation';
import { IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';
import { useCreateWorkflowRelease, useWorkflowVersions } from '@/apis/workflow/version';
import { ToolButton } from '@/components/layout/vines-view/flow/toolbar/tool-button.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IWorkflowReleaseProps extends React.ComponentPropsWithoutRef<'div'> {
  version?: number;
  onVersionChange?: (version: number) => void;
}

export const WorkflowRelease: React.FC<IWorkflowReleaseProps> = ({ version, onVersionChange }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { setVisible } = useCanvasStore();

  const { data: validation, mutate: reValidation } = useWorkflowValidation(workflowId, version);
  const { data: workflowVersions } = useWorkflowVersions(workflowId);
  const { trigger } = useCreateWorkflowRelease(workflowId);

  const [disabled, setDisabled] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleRelease = (ignore = false, validated?: boolean) => {
    if (disabled) {
      toast.warning(t('workspace.flow-view.version.release.recheck.disable'));
      return;
    }
    if (!workflowVersions) {
      toast.error(t('workspace.flow-view.version.release.workflow-version-error'));
      return;
    }

    if (!ignore) {
      if (validated !== void 0 ? !validated : !validation?.validated) {
        setHasError(true);
        return;
      }
      toast(t('workspace.flow-view.version.release.tips'), {
        action: {
          label: t('workspace.flow-view.version.release.action'),
          onClick: () => handleRelease(true),
        },
      });
      return;
    }

    const nextVersionNumber = Math.max(...workflowVersions.map((x) => x.version)) + 1;
    const finalWorkflow = { ...workflowVersions[0], version: nextVersionNumber };
    toast.promise(trigger(finalWorkflow), {
      loading: t('workspace.flow-view.version.release.loading'),
      success: () => {
        setVisible(false);
        setTimeout(() => {
          onVersionChange?.(nextVersionNumber);

          void mutate(`/api/workflow/metadata/${workflowId}/versions`);

          setTimeout(() => setVisible(true), 80);
        }, 164);
        return t('workspace.flow-view.version.release.success');
      },
      error: t('workspace.flow-view.version.release.failed'),
    });
  };

  const targetVersions = workflowVersions?.slice(0, 2).map((it) => {
    const workflow = pick(it, ['tasks', 'output', 'variables', 'name', 'logo', 'desc']);
    const tasks = workflow?.tasks?.filter((task) => task.name !== 'fake_node') ?? [];
    return { ...workflow, tasks };
  });

  useEffect(() => {
    const targetVersionLength = targetVersions?.length;
    if (!targetVersionLength) return;
    if (targetVersionLength < 2) {
      setDisabled(false);
      return;
    }
    setDisabled(equal(targetVersions[0], targetVersions[1]));
  }, [targetVersions]);

  const handleReCheck = () => {
    if (!isLatestWorkflowVersion) return;
    if (disabled) {
      toast.warning(t('workspace.flow-view.version.release.recheck.disable'));
      return;
    }
    toast.promise(reValidation, {
      loading: t('workspace.flow-view.version.release.recheck.loading'),
      success: (it: IWorkflowValidation | undefined) => {
        handleRelease(false, it?.validated);
        return t('workspace.flow-view.version.release.recheck.success');
      },
      error: t('workspace.flow-view.version.release.recheck.error'),
    });
  };

  useHotkeys([['ctrl+s', handleReCheck, { preventDefault: true }]]);

  return (
    <>
      <ToolButton
        className={cn(!isLatestWorkflowVersion && 'hidden')}
        icon={<GitCommitHorizontal />}
        side="bottom"
        tip={t('workspace.flow-view.version.release.button')}
        keys={['ctrl', 's']}
        disabled={disabled || !isLatestWorkflowVersion}
        onClick={handleReCheck}
      />
      <AlertDialog open={hasError} onOpenChange={setHasError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.flow-view.version.release.error.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workspace.flow-view.version.release.error.desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('workspace.flow-view.version.release.error.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRelease(true)}>
              {t('workspace.flow-view.version.release.error.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
