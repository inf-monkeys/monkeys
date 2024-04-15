import React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { IVectorRecord } from '@/apis/vector/typings.ts';
import { ParagraphOperateCell } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list/paragraph-operate-cell.tsx';

export const columns: ColumnDef<IVectorRecord>[] = [
  {
    id: 'rank',
    header: '相似度排名',
    size: 32,
    cell: ({ row }) => <span>{row.index + 1}</span>,
  },
  {
    accessorKey: '_source.page_content',
    header: '文本',
    id: 'text',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorKey: '_source.page_content',
    header: '字符数',
    id: 'charCount',
    size: 24,
    cell: ({ cell }) => <span>{(cell.getValue() as string)?.length}</span>,
  },
  {
    accessorFn: (row) => row,
    id: 'operate',
    header: '操作',
    size: 64,
    cell: ParagraphOperateCell,
  },
];
