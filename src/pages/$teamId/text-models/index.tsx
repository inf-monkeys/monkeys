import React, { useState } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { FileUp, Trash } from 'lucide-react';

import { preloadUgcTextModels, useUgcTextModels } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcPublishDialog } from '@/components/layout/ugc/publish-dialog';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextModelsColumns } from '@/components/layout/ugc-pages/text-models/consts.tsx';
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

export const TextModels: React.FC = () => {
  const navigate = useNavigate();

  const [publishVisible, setPublishVisible] = useState(false);

  const [current, setCurrent] = useState<IAssetItem | undefined>();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-models"
        assetType="llm-model"
        assetName="语言模型"
        useUgcFetcher={useUgcTextModels}
        preloadUgcFetcher={preloadUgcTextModels}
        createColumns={() => createTextModelsColumns()}
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
              <DropdownMenuLabel>语言模型操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
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
            to: `/$teamId/text-models/${item.name}`,
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

export const Route = createFileRoute('/$teamId/text-models/')({
  component: TextModels,
  beforeLoad: teamIdGuard,
});
