import React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { VinesWorkflowExecutionStatData } from '@/apis/workflow/execution/typings.ts';
import { CHART_INFO } from '@/components/layout/vines-view/execution-log/stat/consts.ts';
import { DataTable } from '@/components/ui/data-table';
import { getI18nContent } from '@/utils';

interface IVinesLogViewStatTableProps {
  searchWorkflowExecutionStatData?: VinesWorkflowExecutionStatData[];
  handleSubmit: () => void;
}

export const VinesLogViewStatTable: React.FC<IVinesLogViewStatTableProps> = ({ searchWorkflowExecutionStatData }) => {
  const CHART_LABEL_MAPPER = CHART_INFO.reduce((acc, item) => {
    acc[item.id] = getI18nContent(item.displayName);
    return acc;
  }, {});

  const columns: ColumnDef<VinesWorkflowExecutionStatData>[] = [
    {
      accessorKey: 'date',
      header: CHART_LABEL_MAPPER['date'],
      cell: ({ cell }) => <span>{cell.getValue() as string}</span>,
    },
    {
      accessorKey: 'totalCount',
      header: CHART_LABEL_MAPPER['totalCount'],
      cell: ({ cell }) => <span>{cell.getValue() as number}</span>,
    },
    {
      accessorKey: 'successCount',
      header: CHART_LABEL_MAPPER['successCount'],
      cell: ({ cell }) => <span>{cell.getValue() as number}</span>,
    },
    {
      accessorKey: 'failedCount',
      header: CHART_LABEL_MAPPER['failedCount'],
      cell: ({ cell }) => <span>{cell.getValue() as number}</span>,
    },
    {
      accessorKey: 'averageTime',
      header: CHART_LABEL_MAPPER['averageTime'],
      cell: ({ cell }) => <span>{cell.getValue() as number}</span>,
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={searchWorkflowExecutionStatData ?? []} />
    </>
  );
};
