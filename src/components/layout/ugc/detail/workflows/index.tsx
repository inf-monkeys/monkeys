import React from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { RenderDescription, RenderIcon, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { DataTable } from '@/components/ui/data-table';

interface IUgcDetailWorkflowsProps {
  data: MonkeyWorkflow[];
}

export const UgcDetailWorkflows: React.FC<IUgcDetailWorkflowsProps> = ({ data }) => {
  const columns = [
    {
      id: 'icon',
      header: '图标',
      cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    },
    {
      icon: 'name',
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
    },
    {
      icon: 'description',
      header: '描述',
      cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
    },
    {
      id: 'user',
      header: '创建者',
      cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />
    </>
  );
};
