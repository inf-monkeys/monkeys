import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { t } from 'i18next';
import { Import } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { preloadUgcActionTools, useUgcActionTools } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createActionToolsColumns } from '@/components/layout/ugc-pages/action-tools/consts.tsx';
import { VinesExternalAccount } from '@/components/layout/ugc-pages/action-tools/external-account';
import { PricingText } from '@/components/layout/ugc-pages/action-tools/utils.tsx';
import { ImportToolModal } from '@/components/layout/workspace/tools/import-tool';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/utils/time.ts';

export const ActionTools: React.FC = () => {
  const { t: tHook } = useTranslation();

  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="action-tools"
        assetType="tools"
        assetName={tHook('components.layout.main.sidebar.list.tool.action-tools.label')}
        isLoadAll
        useUgcFetcher={useUgcActionTools}
        preloadUgcFetcher={preloadUgcActionTools}
        createColumns={() => createActionToolsColumns({ hooks: { navigate } })}
        renderOptions={{
          subtitle: (item) => {
            const extra = item.extra;
            const estimateTime = extra ? extra.estimateTime : undefined;
            return (
              <span className="line-clamp-1">
                {t('ugc-page.action-tools.utils.estimate.estimate-time', {
                  time: formatTime({ seconds: estimateTime, defaultSeconds: 30 }),
                })}
                {' | '}
                {extra ? PricingText({ pricing: extra }) : t('ugc-page.action-tools.utils.pricing-mode.FREE')}
              </span>
            );
          },
          cover: (item) => RenderIcon({ iconUrl: item.icon, size: 'gallery' }),
        }}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/action-tools/${item.name}/`,
          });
        }}
        subtitle={
          <>
            <VinesExternalAccount />
            <ImportToolModal>
              <Button variant="outline" size="small" icon={<Import />}>
                {tHook('common.utils.import')}
              </Button>
            </ImportToolModal>
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
