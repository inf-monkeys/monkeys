import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useUgcTools } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { VinesExternalAccount } from '@/components/layout/ugc-pages/action-tools/external-account';
import { PricingText } from '@/components/layout/ugc-pages/action-tools/utils.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/comfyui-workflows/operate-area';
import { createToolsColumns } from '@/components/layout/ugc-pages/tools/consts.tsx';
import { ImportTools } from '@/components/layout/ugc-pages/tools/import-tool';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTime } from '@/utils/time.ts';

export const Tools: React.FC = () => {
  const { t: tHook } = useTranslation();

  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="tools"
        assetType="tools"
        assetName={tHook('components.layout.main.sidebar.list.tools.label')}
        isLoadAll
        useUgcFetcher={useUgcTools}
        createColumns={() => createToolsColumns({ hooks: { navigate } })}
        renderOptions={{
          subtitle: (item) => {
            if (item.toolType === 'tool') {
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
            } else {
              return <span className="line-clamp-1">{tHook('ugc-page.comfyui-workflow.utils.name')}</span>;
            }
          },
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/${item.toolType === 'comfyui' ? 'comfyui' : 'action-tools'}/${item.name}/`,
          });
        }}
        subtitle={
          <>
            <VinesExternalAccount />
            <ImportTools />
          </>
        }
        operateArea={(item, trigger, tooltipTriggerContent) =>
          item.toolType === 'comfyui' ? (
            <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
          ) : undefined
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/tools/')({
  component: Tools,
  beforeLoad: teamIdGuard,
});