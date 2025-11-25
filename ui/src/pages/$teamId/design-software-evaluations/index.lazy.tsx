import React, { useEffect, useMemo, useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { VinesLoading } from '@/components/ui/loading';

const WORKFLOW_ID = '68db488c1f1339a3eeb377a9';
const PAGE_ID = '68db488d14d998637f3c4938';
const WORKSPACE_PATH = `/workspace/${WORKFLOW_ID}/${PAGE_ID}`;

export const DesignSoftwareEvaluations: React.FC = () => {
  const { teamId } = Route.useParams();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const iframeSrc = useMemo(() => {
    return `/${teamId}${WORKSPACE_PATH}?hideSpaceHeader=1`;
  }, [teamId]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [iframeSrc]);

  return (
    <main className="size-full">
      <div className="relative flex size-full flex-col overflow-hidden rounded-lg border border-input bg-slate-1">
        {!iframeLoaded && (
          <div className="vines-center absolute inset-0 z-10 bg-slate-1">
            <VinesLoading />
          </div>
        )}
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title="设计软件测评工作台"
          className="h-full w-full flex-1 border-0"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/design-software-evaluations/')({
  component: DesignSoftwareEvaluations,
});
