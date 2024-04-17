import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { FileDown } from 'lucide-react';

import { preloadUgcTextModelStore, useUgcTextModelStore } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextModelStoreColumns } from '@/components/layout/ugc-pages/text-model-store/consts.tsx';
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

export const TextModelStore: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-model-store"
        assetType="llm-model"
        assetName="语言模型市场"
        isMarket
        useUgcFetcher={useUgcTextModelStore}
        preloadUgcFetcher={preloadUgcTextModelStore}
        createColumns={() => createTextModelStoreColumns()}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
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
              <DropdownMenuLabel>文本模型市场操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => {}}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FileDown size={15} />
                  </DropdownMenuShortcut>
                  导入该团队
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        onItemClick={(item) => {
          // void navigate({
          //   to: `/$teamId/action-tools/${item.name}`,
          // });
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-model-store/')({
  component: TextModelStore,
  beforeLoad: teamIdGuard,
});
