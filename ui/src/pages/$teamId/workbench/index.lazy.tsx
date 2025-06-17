import React, { useEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { getWorkflowExecutionAllOutputs } from '@/apis/workflow/execution';
import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { ImagesResult, useExecutionImageResultStore } from '@/store/useExecutionImageResultStore';
import { usePageStore } from '@/store/usePageStore';
import { convertExecutionResultToThumbnailList } from '@/utils/execution';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);
  const { setImages } = useExecutionImageResultStore();

  const [{ mode, showGroup: urlShowGroup }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini'; showGroup: boolean }>({
    mode: 'normal',
    showGroup: false,
  });

  // const showGroup = oem?.theme.showSidebarPageGroup ?? urlShowGroup;
  const showGroup = true;

  useEffect(() => {
    setTimeout(() => setWorkbenchVisible(true), 80);
  }, []);

  useEffect(() => {
    window['sideBarMode'] = mode;
    window['sideBarShowGroup'] = showGroup;
  }, [mode, showGroup]);

  // 获取执行结果
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getWorkflowExecutionAllOutputs();
        if (response && Array.isArray(response)) {
          const items = response.flatMap((output) => convertExecutionResultToThumbnailList(output));
          const imageItems = items.filter((item): item is ImagesResult => item.render.type === 'image');
          setImages(imageItems);
        }
      } catch (error) {
        console.error('Failed to fetch execution outputs:', error);
      }
    };
    fetchData();
  }, [setImages]);

  return (
    <main className="relative flex size-full">
      <WorkbenchSidebar mode={mode} showGroup={showGroup} />
      <div className="flex size-full flex-col">
        <WorkbenchView mode={mode} />
        {/* <HistoryResult loading={false} imageItems={images} isMiniFrame={mode === 'mini'} /> */}
      </div>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
