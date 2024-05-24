import React from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { RenderDescription, RenderIcon, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { DataTable } from '@/components/ui/data-table';
import { useTranslation } from 'react-i18next';

interface IUgcDetailWorkflowsProps {
  data: MonkeyWorkflow[];
}

export const UgcDetailWorkflows: React.FC<IUgcDetailWorkflowsProps> = ({ data }) => {
  const { t } = useTranslation();

  const columns = [
    {
      id: 'icon',
      header: t('components.layout.ugc.detail.workflows.columns.icon.label'),
      cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    },
    {
      id: 'displayName',
      accessorKey: 'displayName',
      header: t('components.layout.ugc.detail.workflows.columns.displayName.label'),
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
      id: 'description',
      accessorKey: 'description',
      header: t('components.layout.ugc.detail.workflows.columns.description.label'),
      cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
    },
    {
      id: 'user',
      header: t('components.layout.ugc.detail.workflows.columns.user.label'),
      cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />
    </>
  );
};
