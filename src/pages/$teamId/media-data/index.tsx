import React, { useState } from 'react';

import { mutate } from 'swr';
import { createFileRoute } from '@tanstack/react-router';

import _ from 'lodash';
import { Trash } from 'lucide-react';

import { preloadUgcMediaData, useUgcMediaData } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcDeleteDialog } from '@/components/layout/ugc/delete-dialog';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createMediaDataColumns } from '@/components/layout/ugc-pages/media-data/consts.tsx';
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

export const MediaData: React.FC = () => {
  const [deleteVisible, setDeleteVisible] = useState(false);

  const [current, setCurrent] = useState<IAssetItem | undefined>();

  return (
    <main className="size-full">
      <UgcView
        assetKey="media-data"
        assetType="media-file"
        assetName="富媒体数据"
        useUgcFetcher={useUgcMediaData}
        preloadUgcFetcher={preloadUgcMediaData}
        createColumns={() => createMediaDataColumns()}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.type === 'image' ? item.url : '', size: 'gallery' }),
        }}
        subtitle={<></>}
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
              <DropdownMenuLabel>富媒体数据操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrent(item);
                    setDeleteVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Trash size={15} />
                  </DropdownMenuShortcut>
                  删除
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        onItemClick={(item) => {}}
      />

      <UgcDeleteDialog
        visible={deleteVisible}
        setVisible={setDeleteVisible}
        assetType={current?.assetType}
        ugcId={current?._id}
        afterOperate={() => {
          void mutate((key) => _.isArray(key) && key[0] === '/api/resources/list', undefined, {
            revalidate: true,
          });
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/media-data/')({
  component: MediaData,
  beforeLoad: teamIdGuard,
});
