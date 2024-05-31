import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Import, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { preloadUgcComfyuiWorkflows, useUgcComfyuiWorkflows } from '@/apis/ugc';
import { createComfyuiWorkflowColumns } from '@/components/layout/ugc-pages/comfyui-workflows/consts';
import { OperateArea } from '@/components/layout/ugc-pages/comfyui-workflows/operate-area';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer';
import { ComfyUIServerListModal } from '@/components/layout/workspace/tools/comfyui-server-list';
import { ImportComfyUIWorkflowModal } from '@/components/layout/workspace/tools/import-comfyui-workflow';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { formatTimeDiffPrevious } from '@/utils/time';

export const ActionTools: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="comfyui-workflow"
        assetType="comfyui-workflow"
        assetName="ComfyUI"
        isLoadAll
        useUgcFetcher={useUgcComfyuiWorkflows}
        preloadUgcFetcher={preloadUgcComfyuiWorkflows}
        createColumns={() => createComfyuiWorkflowColumns({ hooks: { navigate } })}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/comfyui/${item.id}`,
          });
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown')} ${t('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        subtitle={
          <>
            <ImportComfyUIWorkflowModal>
              <Button variant="outline" size="small" icon={<Import />}>
                {t('common.utils.import')}
              </Button>
            </ImportComfyUIWorkflowModal>
            <ComfyUIServerListModal>
              <Button variant="outline" size="small" icon={<Server />}>
                {t('workspace.tools.comfyui-server.title')}
              </Button>
            </ComfyUIServerListModal>
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/comfyui/')({
  component: ActionTools,
  beforeLoad: teamIdGuard,
});
