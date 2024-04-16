import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { FileUp, Trash } from 'lucide-react';

import { preloadUgcTableData, useUgcTableData } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTableDataColumns } from '@/components/layout/ugc-pages/table-data/consts.tsx';
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

export const TableData: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="table-data"
        assetType="knowledge-base-table"
        assetName="表格数据"
        useUgcFetcher={useUgcTableData}
        preloadUgcFetcher={preloadUgcTableData}
        createColumns={() => createTableDataColumns()}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
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
              <DropdownMenuLabel>表格数据操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => {}}>
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
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/table-data/')({
  component: TableData,
  beforeLoad: teamIdGuard,
});
