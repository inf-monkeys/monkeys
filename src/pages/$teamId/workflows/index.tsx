import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { useClipboard } from '@mantine/hooks';
import { Copy, FileUp, FolderUp, Link, MoreHorizontal, Pencil, Trash } from 'lucide-react';

import { IPaginationListData } from '@/apis/typings.ts';
import { listUgcWorkflowsMock } from '@/apis/ugc/mock.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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
import { Tooltip } from '@/components/ui/tooltip';
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
        // fetchFunction={async () => listUgcWorkflowsMock as unknown as IPaginationListData<IAssetItem<MonkeyWorkflow>>}
        data={listUgcWorkflowsMock as unknown as IPaginationListData<IAssetItem<MonkeyWorkflow>>}
        columns={[
          {
            accessorKey: '_id',
          },
          {
            accessorKey: 'workflowId',
          },
          {
            accessorKey: 'iconUrl',
            accessorFn: (row) => <VinesIcon size="md">{(row.iconUrl as string) ?? ''}</VinesIcon>,
          },
          {
            accessorKey: 'name',
          },
          {
            accessorKey: 'user',
          },
          {
            accessorKey: 'createdTimestamp',
            cell: (props) => '',
          },
          {
            accessorKey: 'updatedTimestamp',
          },
          {
            id: 'subtitle',
            accessorFn: (row) => (
              <div className="flex gap-1">
                <span>{row.user?.name ?? '未知'}</span>
                <span>创建于</span>
                <span>{formatTimeDiffPrevious(row.createdTimestamp)}</span>
              </div>
            ),
          },
        ]}
        renderOptions={{
          logo: 'iconUrl',
          title: 'name',
          subtitle: 'subtitle',
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
