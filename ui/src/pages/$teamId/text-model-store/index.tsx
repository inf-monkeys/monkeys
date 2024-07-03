import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ILLMChannel } from '@/apis/llm/typings';
import { preloadUgcTextModelStore, useUgcTextModelStore } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings';
import { LLMChannelImportDialog } from '@/components/layout/ugc/import-dialog/llm-channel';
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
  const { t } = useTranslation();

  const [current, setCurrent] = useState<IAssetItem<ILLMChannel>>();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-model-store"
        assetType="llm-channel"
        assetName={t('components.layout.main.sidebar.list.store.text-model-store.label')}
        isMarket
        useUgcFetcher={useUgcTextModelStore}
        preloadUgcFetcher={preloadUgcTextModelStore}
        createColumns={() => createTextModelStoreColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.system')} ${t('common.utils.created-at', {
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
              <DropdownMenuLabel>{t('components.layout.ugc.import-dialog.dropdown')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <LLMChannelImportDialog channel={current}>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      setCurrent(item);
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                      <FileDown size={15} />
                    </DropdownMenuShortcut>
                    {t('components.layout.ugc.import-dialog.import-to-team')}
                  </DropdownMenuItem>
                </LLMChannelImportDialog>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-model-store/')({
  component: TextModelStore,
  beforeLoad: teamIdGuard,
});
