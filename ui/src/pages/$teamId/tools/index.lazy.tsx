import React from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

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
        showPagination={false}
        useUgcFetcher={useUgcTools}
        createColumns={() => createToolsColumns({ hooks: { navigate } })}
        renderOptions={{
          subtitle: (item) => {
            if (item.toolType === 'comfyui') {
              return <span className="line-clamp-1">{tHook('ugc-page.comfyui-workflow.utils.name')}</span>;
            } else if (item.toolType === 'sub-workflow') {
              return <span className="line-clamp-1">{tHook('ugc-page.tools.utils.sub-workflow')}</span>;
            } else {
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
            }
          },
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        onItemClick={(item) => {
          switch (item.toolType) {
            case 'comfyui':
              void navigate({
                to: `/$teamId/comfyui/${item.name}/`,
              });
              break;

            case 'tool':
            case 'api':
            case 'service':
              void navigate({
                to: `/$teamId/action-tools/${item.name}/`,
              });
              break;

            default:
              break;
          }
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

export const Route = createLazyFileRoute('/$teamId/tools/')({
  component: Tools,
});
