import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { preloadUgcTextModelStore, useUgcTextModelStore } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { createTextModelStoreColumns } from '@/components/layout/ugc-pages/text-model-store/consts.tsx';
import { UgcImportDialog } from '@/components/layout/ugc/import-dialog';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
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
  const { t: tHook } = useTranslation();

  const [importVisible, setImportVisible] = useState(false);

  const [current, setCurrent] = useState<IAssetItem>();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-model-store"
        assetType="llm-model"
        assetName={tHook('components.layout.main.sidebar.list.store.text-model-store.label')}
        isMarket
        useUgcFetcher={useUgcTextModelStore}
        preloadUgcFetcher={preloadUgcTextModelStore}
        createColumns={() => createTextModelStoreColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.system')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
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
              <DropdownMenuLabel>操作</DropdownMenuLabel>
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
      />

      <UgcImportDialog
        visible={importVisible}
        setVisible={setImportVisible}
        ugcId={current?.id}
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
