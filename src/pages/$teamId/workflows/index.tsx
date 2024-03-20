import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useClipboard } from '@mantine/hooks';
import { Copy, FileUp, FolderUp, Link, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import moment from 'moment';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { preloadUgcWorkflows, useUgcWorkflows } from '@/apis/ugc';
import { UgcSidebar } from '@/components/layout/ugc/sidebar';
import { UgcView } from '@/components/layout/ugc/view';
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
import { VinesIcon } from '@/components/ui/vines-icon';
import { useTimeDiff } from '@/utils/time.ts';

export const Workflows: React.FC = () => {
  const { formatTimeDiffPrevious } = useTimeDiff();
  const navigate = useNavigate();
  const clipboard = useClipboard({ timeout: 500 });

  return (
    <main className="flex size-full">
      <UgcSidebar title="工作流" />
      <UgcView
        assetKey="workflow"
        useUgcFetcher={useUgcWorkflows}
        preloadUgcFetcher={preloadUgcWorkflows}
        columns={[
          {
            accessorKey: 'iconUrl',
            header: '图标',
            accessorFn: (row) => <VinesIcon size="md">{(row.iconUrl as string) ?? ''}</VinesIcon>,
            cell: (props) => props.getValue() as React.ReactNode,
            maxSize: 48,
          },
          {
            accessorKey: 'name',
            header: '名称',
          },
          {
            accessorKey: 'description',
            header: '描述',
            cell: (props) => <span className="text-opacity-70">{(props.getValue() as string) || '暂无描述'}</span>,
          },
          {
            accessorKey: 'user',
            header: '用户',
            cell: (props) => <span>{(props.getValue() as IVinesUser).name ?? ''}</span>,
            maxSize: 48,
          },
          {
            accessorKey: 'createdTimestamp',
            header: '创建时间',
            cell: (props) => (
              <Tooltip content={moment(props.getValue() as number).format('YYYY-MM-DD HH:mm:ss')}>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{formatTimeDiffPrevious(props.getValue() as number)}</span>
                </TooltipTrigger>
              </Tooltip>
            ),
            maxSize: 72,
          },
          {
            accessorKey: 'updatedTimestamp',
            header: '更新时间',
            cell: (props) => (
              <Tooltip content={moment(props.getValue() as number).format('YYYY-MM-DD HH:mm:ss')}>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{formatTimeDiffPrevious(props.getValue() as number)}</span>
                </TooltipTrigger>
              </Tooltip>
            ),
            maxSize: 72,
          },
        ]}
        renderOptions={{
          logo: 'iconUrl',
          title: 'name',
          description: 'description',
          subtitle: (item) => {
            return (
              <div className="flex gap-1">
                <span>{item.user?.name ?? '未知'}</span>
                <span>创建于</span>
                <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
              </div>
            );
          },
        }}
        operateArea={(item) => (
          <DropdownMenu>
            <Tooltip content="操作">
              <DropdownMenuTrigger asChild>
                <Button icon={<MoreHorizontal />} size="small" />
              </DropdownMenuTrigger>
            </Tooltip>
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
          void navigate({
            to: '/$teamId/workspace/$workflowId',
            params: { teamId: item.teamId, workflowId: item.workflowId },
          });
        }}
        subtitle={
          <>
            <Button>导入</Button>
            <Button variant="solid">新建</Button>
          </>
        }
      />
      ;
    </main>
  );
};

export const Route = createFileRoute('/$teamId/workflows/')({
  component: Workflows,
  beforeLoad: teamIdGuard,
});
