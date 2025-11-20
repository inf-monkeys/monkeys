import React, { useEffect, useState } from 'react';

import { useThrottleEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranchPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { useWorkspacePages } from '@/apis/pages';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { InitTeamButton } from '@/components/ui/init-team-button';
import { VinesLoading } from '@/components/ui/loading';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useCurrentGroupId, useCurrentPage } from '@/store/useCurrentPageStore';
import { usePageStore } from '@/store/usePageStore';
import { cn, getI18nContent } from '@/utils';

interface IWorkbenchViewProps extends React.ComponentPropsWithoutRef<'div'> {
  mode?: 'normal' | 'fast' | 'mini';
}

export const WorkbenchView: React.FC<IWorkbenchViewProps> = ({ mode }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useWorkspacePages();
  const [pages, setPages] = useState(data?.pages);
  const { data: systemConfig } = useSystemConfig();
  const [visionProAlertVisible, setVisionProAlertVisible] = useState(false);

  // const [fullFrameMode, setFullFrameMode] = useState(true);

  useEffect(() => {
    if (typeof data !== 'undefined') {
      setPages(data?.pages ?? []);
    }
  }, [data?.pages]);

  const { ref, width, height } = useElementSize();

  const { teamId } = useVinesTeam();
  // const [page] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});
  const page = useCurrentPage();
  const currentGroupId = useCurrentGroupId();

  const hasPages = (pages?.length ?? 0) > 0;

  const teamPage = page?.[teamId] ?? {};
  const hasPage = !!(teamPage?.id && teamPage?.type);

  // 检查是否是 Vision Pro 工作流
  const pageName = getI18nContent(teamPage?.displayName) ?? '';
  const workflowName = getI18nContent(teamPage?.workflow?.displayName) ?? '';
  const visionProWorkflows = systemConfig?.theme?.visionProWorkflows ?? [];
  const isVisionProWorkflow =
    hasPage && (visionProWorkflows.includes(pageName) || visionProWorkflows.includes(workflowName));

  // 当检测到"具身演化"工作流时，自动显示弹窗
  useEffect(() => {
    if (isVisionProWorkflow) {
      setVisionProAlertVisible(true);
    }
  }, [isVisionProWorkflow]);

  const setContainerWidth = usePageStore((s) => s.setContainerWidth);
  const setContainerHeight = usePageStore((s) => s.setContainerHeight);

  useThrottleEffect(
    () => {
      setContainerWidth(width);
      if (height) {
        setContainerHeight(height - (mode === 'mini' ? 16 : 0));
      }
    },
    [width, height, mode],
    { wait: 64 },
  );

  const setPage = usePageStore((s) => s.setPage);
  useEffect(() => {
    if (teamPage?.id && teamPage?.customOptions) {
      setPage({ id: teamPage.id, customOptions: teamPage.customOptions } as any);
    }
  }, [teamPage]);

  // 计算 workspaceName：根据当前选中的分组名，否则用页面名
  const workspaceName = React.useMemo(() => {
    if (!teamPage?.id || !data?.groups || !currentGroupId) return undefined;
    // 首先尝试从当前选中的组ID中获取组
    const targetGroup = data.groups.find((g: any) => g.id === currentGroupId && g.pageIds?.includes(teamPage.id));
    if (targetGroup?.displayName) {
      return getI18nContent(targetGroup.displayName) || undefined;
    }
    // 如果当前组不包含该页面，则寻找任何包含该页面的组
    const fallbackGroup = data.groups.find((g: any) => g.pageIds?.includes(teamPage.id));
    if (fallbackGroup?.displayName) {
      return getI18nContent(fallbackGroup.displayName) || undefined;
    }
    // 如果找不到分组，就用页面名
    return getI18nContent(teamPage?.displayName) || undefined;
  }, [teamPage?.id, teamPage?.displayName, data?.groups, currentGroupId]);

  return (
    <div
      ref={ref}
      className={cn('relative w-full flex-1 overflow-hidden p-0', mode === 'mini' ? 'rounded-none' : 'rounded-lg')}
    >
      <AnimatePresence>
        {hasPages && hasPage ? (
          isVisionProWorkflow ? (
            // 如果是"具身演化"工作流，显示提示而不是渲染工作流内容
            <motion.div
              key="vines-workbench-view-vision-pro"
              className="vines-center absolute top-0 size-full flex-col gap-global"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <GitBranchPlus size={64} />
              <div className="flex flex-col text-center">
                <h2 className="font-bold">请在 Vision Pro 中打开使用</h2>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="vines-workbench-view"
              className="absolute top-0 size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/*{mode !== 'mini' && <WorkbenchViewHeader page={teamPage} groupId={groupId} />}*/}
              <div className={cn('relative size-full overflow-hidden')}>
                <VinesIFrame from="workbench" pages={pages ?? []} page={teamPage} workspaceName={workspaceName} />
              </div>
            </motion.div>
          )
        ) : isLoading ? (
          <VinesLoading className="vines-center size-full" />
        ) : (
          <motion.div
            key="vines-workbench-view-empty"
            className="vines-center absolute top-0 size-full flex-col gap-global"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GitBranchPlus size={64} />
            <div className="flex flex-col text-center">
              <h2 className="font-bold">{t('workbench.view.no-starred-view')}</h2>
            </div>
            <InitTeamButton />
          </motion.div>
        )}
      </AnimatePresence>
      <AlertDialog open={visionProAlertVisible} onOpenChange={setVisionProAlertVisible}>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.utils.tips')}</AlertDialogTitle>
            <AlertDialogDescription>请在 Vision Pro 中打开使用</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setVisionProAlertVisible(false)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
