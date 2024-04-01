import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useClipboard } from '@mantine/hooks';
import { Copy, FileUp, FolderUp, Link, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { preloadUgcWorkflows, useUgcWorkflows } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
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

export const Workflows: React.FC = () => {
  const clipboard = useClipboard({ timeout: 500 });

  return (
    <main className="size-full">
      <UgcView
        assetKey="workflow"
        assetType="workflow"
        assetName="工作流"
        useUgcFetcher={useUgcWorkflows}
        preloadUgcFetcher={preloadUgcWorkflows}
        createColumns={(columnHelper) => {
          return [
            columnHelper.accessor('iconUrl', {
              id: 'logo',
              header: '图标',
              cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
              maxSize: 48,
            }),
            columnHelper.accessor('name', {
              id: 'title',
              header: '名称',
              cell: ({ row, getValue }) => (
                <a
                  className="transition-colors hover:text-primary-500"
                  href={`/${row.original.teamId}/workspace/${row.original.workflowId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {getValue() as string}
                </a>
              ),
            }),
            columnHelper.accessor('description', {
              id: 'description',
              header: '描述',
              cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
            }),
            columnHelper.accessor('user', {
              id: 'user',
              header: '用户',
              cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
              maxSize: 48,
            }),
            columnHelper.accessor('assetTags', {
              id: 'assetTags',
              header: '标签',
              maxSize: 96,
            }),
            columnHelper.accessor('createdTimestamp', {
              id: 'createdTimestamp',
              header: '创建时间',
              cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
              maxSize: 72,
            }),
            columnHelper.accessor('updatedTimestamp', {
              id: 'updatedTimestamp',
              header: '更新时间',
              cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
              maxSize: 72,
            }),
          ];
        }}
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
              <DropdownMenuLabel>工作流操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    clipboard.copy(location.origin.concat(`/${item.teamId}/workspace/${item.workflowId}`));
                    toast.success('链接复制成功');
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  复制链接
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => {}}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Copy size={15} />
                  </DropdownMenuShortcut>
                  创建副本
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Pencil size={15} />
                  </DropdownMenuShortcut>
                  编辑信息
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FileUp size={15} />
                  </DropdownMenuShortcut>
                  导出当前版本
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FolderUp size={15} />
                  </DropdownMenuShortcut>
                  导出全部版本
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
          window.open(`/${item.teamId}/workspace/${item.workflowId}`, '_blank');
        }}
        subtitle={
          <>
            <Button>导入</Button>
            <Button variant="solid">新建</Button>
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/workflows/')({
  component: Workflows,
  beforeLoad: teamIdGuard,
});
