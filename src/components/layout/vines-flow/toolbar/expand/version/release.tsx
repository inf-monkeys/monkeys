import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useHotkeys } from '@mantine/hooks';
import equal from 'fast-deep-equal/es6';
import { pick } from 'lodash';
import { GitCommitHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { useWorkflowValidation } from '@/apis/workflow/validation';
import { IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';
import { useCreateWorkflowRelease, useWorkflowVersions } from '@/apis/workflow/version';
import { ToolButton } from '@/components/layout/vines-flow/toolbar/tool-button.tsx';
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
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IWorkflowReleaseProps extends React.ComponentPropsWithoutRef<'div'> {
  version?: number;
  onVersionChange?: (version: number) => void;
}

export const WorkflowRelease: React.FC<IWorkflowReleaseProps> = ({ version, onVersionChange }) => {
  const { mutate } = useSWRConfig();

  const { workflowId, isLatestWorkflowVersion, setVisible } = useFlowStore();

  const { data: validation, mutate: reValidation } = useWorkflowValidation(workflowId, version);
  const { data: workflowVersions } = useWorkflowVersions(workflowId);
  const { trigger } = useCreateWorkflowRelease(workflowId);

  const [disabled, setDisabled] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleRelease = (ignore = false, validated?: boolean) => {
    if (disabled) {
      toast.warning('当前工作流配置与上一个版本相同，无需创建版本');
      return;
    }
    if (!workflowVersions) {
      toast.error('创建版本失败！无法获取工作流版本信息');
      return;
    }

    if (!ignore) {
      if (validated !== void 0 ? !validated : !validation?.validated) {
        setHasError(true);
        return;
      }
      toast('确定要为此工作流创建版本吗', {
        action: {
          label: '确定',
          onClick: () => handleRelease(true),
        },
      });
      return;
    }

    const nextVersionNumber = Math.max(...workflowVersions.map((x) => x.version)) + 1;
    const finalWorkflow = { ...workflowVersions[0], version: nextVersionNumber };
    toast.promise(trigger(finalWorkflow), {
      loading: '正在创建版本',
      success: () => {
        setVisible(false);
        setTimeout(() => {
          onVersionChange?.(nextVersionNumber);

          void mutate(`/api/workflow/metadata/${workflowId}/versions`);

          setTimeout(() => setVisible(true), 80);
        }, 164);
        return '版本创建成功';
      },
      error: '版本创建失败',
    });
  };

  const targetVersions = workflowVersions?.slice(0, 2).map((it) => {
    const workflow = pick(it, ['workflowDef', 'output', 'variables', 'name', 'logo', 'desc']);
    const tasks = workflow.workflowDef?.tasks?.filter((task) => task.name !== 'fake_node') ?? [];
    return { ...workflow, workflowDef: { tasks } };
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
      toast.warning('当前工作流配置与上一个版本相同，无需创建版本');
      return;
    }
    toast.promise(reValidation, {
      loading: '正在检测工作流配置',
      success: (it: IWorkflowValidation | undefined) => {
        handleRelease(false, it?.validated);
        return '工作流配置检测完毕';
      },
      error: '工作流配置检测失败',
    });
  };

  useHotkeys([['ctrl+s', handleReCheck, { preventDefault: true }]]);

  return (
    <>
      <ToolButton
        className={cn(!isLatestWorkflowVersion && 'hidden')}
        icon={<GitCommitHorizontal />}
        side="bottom"
        tip="创建版本"
        keys={['ctrl', 's']}
        disabled={disabled || !isLatestWorkflowVersion}
        onClick={handleReCheck}
      />
      <AlertDialog open={hasError} onOpenChange={setHasError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>检测到工作流配置存在错误</AlertDialogTitle>
            <AlertDialogDescription>确定要继续创建版本吗？配置出错的工作流将无法运行！</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRelease(true)}>继续创建版本</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
