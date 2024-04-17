import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { FileDown } from 'lucide-react';

import { preloadUgcTextModelStore, useUgcTextModelStore } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcImportDialog } from '@/components/layout/ugc/import-dialog';
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
  const [importVisible, setImportVisible] = useState(false);

  const [current, setCurrent] = useState<IAssetItem>();

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
            <span className="line-clamp-1">
              {`${item.user?.name ?? '未知'} 创建于 ${formatTimeDiffPrevious(item.createdTimestamp)}`}
            </span>
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
                <DropdownMenuItem
                  onSelect={() => {
                    setCurrent(item);
                    setImportVisible(true);
                  }}
                >
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

      <UgcImportDialog
        visible={importVisible}
        setVisible={setImportVisible}
        ugcId={current?._id}
        assetType={current?.assetType}
        name={current?.name}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-model-store/')({
  component: TextModelStore,
  beforeLoad: teamIdGuard,
});
