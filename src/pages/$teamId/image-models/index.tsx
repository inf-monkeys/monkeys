import React, { useState } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { FileUp, Play, Trash } from 'lucide-react';

import { preloadUgcImageModels, useUgcImageModels } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcPublishDialog } from '@/components/layout/ugc/publish-dialog';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createImageModelsColumns } from '@/components/layout/ugc-pages/image-models/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ImageModels: React.FC = () => {
  const navigate = useNavigate();

  const [publishVisible, setPublishVisible] = useState(false);

  const [current, setCurrent] = useState<IAssetItem | undefined>();

  return (
    <main className="size-full">
      <UgcView
        assetKey="image-models"
        assetType="sd-model"
        assetName="图像模型"
        useUgcFetcher={useUgcImageModels}
        preloadUgcFetcher={preloadUgcImageModels}
        createColumns={() => createImageModelsColumns()}
        renderOptions={{
          subtitle: (item) => {
            return (
              <div className="flex gap-1">
                <span>{item.user?.name ?? '未知'}</span>
                <span>创建于</span>
                <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
              </div>
            );
          },
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <DropdownMenu>
            {tooltipTriggerContent ? (
              <Tooltip content={tooltipTriggerContent}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                </TooltipTrigger>
              </Tooltip>
            ) : (
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            )}

            <DropdownMenuContent
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuLabel>图像模型操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Play size={15} />
                  </DropdownMenuShortcut>
                  调试
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setCurrent(item);
                    setPublishVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FileUp size={15} />
                  </DropdownMenuShortcut>
                  发布到市场
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-10" onSelect={() => {}}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Trash size={15} />
                  </DropdownMenuShortcut>
                  删除
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/image-models/${item.name}`,
          });
        }}
      />

      <UgcPublishDialog
        visible={publishVisible}
        setVisible={setPublishVisible}
        ugcId={current?._id}
        item={current ?? {}}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/image-models/')({
  component: ImageModels,
  beforeLoad: teamIdGuard,
});
