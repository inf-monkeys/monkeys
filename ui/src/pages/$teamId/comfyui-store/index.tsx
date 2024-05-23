import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { preloadComfyUIWorkflowStore, useUgcComfyUIWorkflowStore } from '@/apis/ugc';
import { createComfyuiStoreColumns } from '@/components/layout/ugc-pages/comfyui-store/consts';
import { OperateArea } from '@/components/layout/ugc-pages/comfyui-store/operate-area';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ComfyUIStore: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="comfyui-store"
        assetType="comfyui-workflow"
        assetName="ComfyUI 市场"
        isMarket
        useUgcFetcher={useUgcComfyUIWorkflowStore}
        preloadUgcFetcher={preloadComfyUIWorkflowStore}
        createColumns={() => createComfyuiStoreColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? '系统内置'} 创建于 ${formatTimeDiffPrevious(item.createdTimestamp)}`}
            </span>
          ),
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/comfyui-store/')({
  component: ComfyUIStore,
  beforeLoad: teamIdGuard,
});
