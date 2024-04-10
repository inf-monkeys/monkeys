import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadUgcActionTools, useUgcActionTools } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createActionToolsColumns } from '@/components/layout/ugc-pages/action-tools/consts.tsx';
import { VinesExternalAccount } from '@/components/layout/ugc-pages/action-tools/external-account';
import { pricingText } from '@/components/layout/ugc-pages/action-tools/utils.ts';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTime } from '@/utils/time.ts';

export const ActionTools: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="action-tools"
        assetType="block"
        assetName="执行类工具"
        useUgcFetcher={useUgcActionTools}
        preloadUgcFetcher={preloadUgcActionTools}
        createColumns={() => createActionToolsColumns}
        renderOptions={{
          subtitle: (item) => {
            const estimateTime = item.extra?.estimateTime;
            const pricing = item.pricing;
            return (
              <span className="line-clamp-1">
                预计执行 {estimateTime ? formatTime(estimateTime) : '30 秒'}，{pricing ? pricingText(pricing) : '免费'}
              </span>
            );
          },
          cover: (item) => {
            return RenderIcon({ iconUrl: item.icon, size: 'gallery' });
          },
        }}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/action-tools/${item.name}`,
          });
        }}
        subtitle={
          <>
            <VinesExternalAccount />
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/action-tools/')({
  component: ActionTools,
  beforeLoad: teamIdGuard,
});
