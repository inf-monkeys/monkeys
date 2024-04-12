import React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { IVectorRecord } from '@/apis/vector/typings.ts';

export const columns: ColumnDef<IVectorRecord>[] = [
  {
    id: 'rank',
    header: '相似度排名',
    size: 24,
    cell: ({ row }) => <span>{row.index + 1}</span>,
  },
  {
    accessorKey: '_source.page_content',
    header: '文本',
    id: 'text',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 100 ? text.slice(0, 100) + '...' : text}</span>;
    },
  },
  {
    accessorKey: '_source.page_content',
    header: '字符数',
    id: 'charCount',
    size: 24,
    cell: ({ cell }) => <span>{(cell.getValue() as string)?.length}</span>,
  },
  // {
  //   id: 'operate',
  //   size: 24,
  //   header: '操作',
  //   cell: ({ row }) => <Button icon={<MoreHorizontal />} size="small" variant="outline" />,
  // },
];
