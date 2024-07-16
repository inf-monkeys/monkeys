import React from 'react';

import { I18nValue, MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { RenderDescription, RenderIcon, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { DataTable } from '@/components/ui/data-table';
import { getI18nContent } from '@/utils';

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
          {getI18nContent(getValue() as string | I18nValue)}
        </a>
      ),
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: t('components.layout.ugc.detail.workflows.columns.description.label'),
      cell: ({ getValue }) => RenderDescription({ description: getI18nContent(getValue() as string | I18nValue) }),
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
