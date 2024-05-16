import React, { useEffect, useMemo, useState } from 'react';

import { ColumnDef, flexRender, getCoreRowModel, Row, useReactTable } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/ui/data-table';

interface IUgcDetailInfoProps {
  columns: ColumnDef<any, any>[];
  data?: any;
  assetKey?: string;
}

export const UgcDetailInfo: React.FC<IUgcDetailInfoProps> = ({ columns, data: rawData, assetKey }) => {
  const { t } = useTranslation();

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(rawData ? [rawData] : []);
  }, [rawData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const row: Row<any> | undefined = table.getRowModel().rows.length === 0 ? undefined : table.getRowModel().rows[0];

  const tableData = useMemo(() => {
    return (
      row?.getAllCells().map((cell) => {
        return {
          key: cell.column.columnDef.id,
          displayName: assetKey
            ? t(`ugc-page.${assetKey}.ugc-view.columns.${cell.column.columnDef.id}.label`)
            : cell.column.columnDef.header?.toString() ?? t('common.utils.unknown'),
          value: flexRender(cell.column.columnDef.cell, cell.getContext()),
        };
      }) ?? []
    );
  }, [data]);

  return (
    <div className="flex flex-col gap-2">
      <DataTable
        columns={[
          {
            id: 'displayName',
            accessorKey: 'displayName',
            header: t('components.layout.ugc.detail.info.columns.displayName.label'),
          },
          {
            id: 'value',
            accessorKey: 'value',
            header: t('components.layout.ugc.detail.info.columns.value.label'),
            cell: ({ cell }) => cell.renderValue(),
          },
        ]}
        data={tableData}
      />
    </div>
  );
};
