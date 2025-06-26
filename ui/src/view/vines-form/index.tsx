import React, { lazy, Suspense } from 'react';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils';
import { useVinesUser } from '@/components/router/guard/user';
import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';
import { ReportProvider } from '@/store/useReportStore/provider';

const VinesFormLazy = lazy(() => import('./vines-form-lazy'));

export const VinesForm: React.FC = () => {
  const { user } = useVinesUser();
  const { workflowId, pageId, teamId } = useVinesPage();

  const onReport = () => {
    return JSON.stringify({
      url: window.location.href,
      user,
      teamId,
      workflowId,
      pageId,
      createdTimestamp: Date.now(),
    });
  };
  return (
    <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
      <ReportProvider onReport={onReport}>
        <VinesFormLazy />
      </ReportProvider>
    </Suspense>
  );
};
